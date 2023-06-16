import { Bundle, ZObject } from "zapier-platform-core";
import {
  doesMeasurementMatchRange,
  enrichMeasurement,
  findConnectionInResponseForPatientId,
  hash,
} from "../utils";
import { GlucoseMeasurement, RangeInputField } from "../types";

const perform = async (
  z: ZObject,
  bundle: Bundle<{
    patientId: string;
    range: RangeInputField;
    repeat: null | number;
    repeatOnly: null | boolean;
  }>
): Promise<GlucoseMeasurement[]> => {
  if (!bundle.inputData.repeat && bundle.inputData.repeatOnly) {
    throw new Error(
      'The "Repeat only" option can only be enabled when "Repeat" option is also set.'
    );
  }

  const response = await z.request("/llu/connections");
  const connection = findConnectionInResponseForPatientId(
    response,
    bundle.inputData.patientId
  );

  const measurement: GlucoseMeasurement = {
    ...enrichMeasurement(
      connection.glucoseMeasurement,
      connection.patientDevice.ll,
      connection.patientDevice.hl
    ),
    _response: JSON.stringify(response),
    isRepeat: bundle.inputData.repeat ? false : null,
    repeatCount: bundle.inputData.repeat ? 0 : null,
  };

  if (bundle.meta.isLoadingSample) {
    z.console.log(
      `Returning measurement because isLoadingSample: ${bundle.meta.isLoadingSample}`
    );
    return [measurement];
  }

  if (!doesMeasurementMatchRange(measurement, bundle.inputData.range)) {
    z.console.log(
      `Returning empty because ${
        bundle.inputData.range
      } does not match ${JSON.stringify(measurement)}`
    );
    return [];
  }

  if (!bundle.inputData.repeat) {
    z.console.log(
      `Returning measurement because repeat: ${bundle.inputData.repeat}`
    );
    return [measurement];
  }

  const xSecret = measurement.id;

  const storeResponse = await z.request({
    url: "https://store.zapier.com/api/records",
    method: "GET",
    headers: {
      "X-Secret": xSecret,
    },
  });

  const CurrentTimestampDate = new Date();
  let repeatCount = 0;

  if (storeResponse.data.TriggerTimestamp) {
    const TriggerTimestampDate = new Date(storeResponse.data.TriggerTimestamp);
    const differenceInMinutes =
      (CurrentTimestampDate.getTime() - TriggerTimestampDate.getTime()) /
      (60 * 1000);

    if (differenceInMinutes < bundle.inputData.repeat) {
      z.console.log(
        `Returning empty because differenceInMinutes: ${CurrentTimestampDate.toISOString()} -  ${TriggerTimestampDate.toISOString()} = ${differenceInMinutes} < ${
          bundle.inputData.repeat
        }`
      );
      return [];
    }

    measurement.id = hash(
      `${measurement.FactoryTimestamp}:${CurrentTimestampDate}`
    );
    measurement.isRepeat = true;
    measurement.repeatCount = repeatCount =
      (storeResponse.data.repeatCount ?? 0) + 1;
  }

  await z.request({
    url: "https://store.zapier.com/api/records",
    method: "POST",
    headers: {
      "X-Secret": xSecret,
    },
    json: {
      TriggerTimestamp: CurrentTimestampDate.toISOString(),
      repeatCount,
    },
  });

  if (bundle.inputData.repeatOnly && !measurement.isRepeat) {
    z.console.log(
      `Returning empty because repeatOnly: ${
        bundle.inputData.repeatOnly
      } and ${!measurement.isRepeat}`
    );
    return [];
  }

  z.console.log(`Returning measurement`);
  return [measurement];
};

export default {
  key: "glucoseMeasurement",
  noun: "Measurement",

  display: {
    label: "New Measurement",
    description: "Triggers when a new measurement is available.",
  },

  operation: {
    inputFields: [
      {
        key: "patientId",
        required: true,
        label: "Connection",
        dynamic: "connection.patientId.fullName",
      },
      {
        key: "tests",
        type: "copy",
        helpText: "The following fields are ignored for tests.",
      },
      {
        key: "range",
        required: false,
        helpText:
          "Only trigger when measurement was high, low, or (not) in range (ignored for tests).",
        choices: [
          {
            value: "isHigh",
            sample: "isHigh",
            label: "High",
          },
          {
            value: "isLow",
            sample: "isLow",
            label: "Low",
          },
          {
            value: "isInRange",
            sample: "isInRange",
            label: "In range",
          },
          {
            value: "isNotInRange",
            sample: "isNotInRange",
            label: "Not in range",
          },
        ],
      },
      {
        key: "repeat",
        type: "integer",
        required: false,
        helpText:
          "Trigger again every selected number of minutes since the last measurement.",
        choices: ["15", "30", "45", "60", "90", "120"],
      },
      {
        key: "repeatOnly",
        label: "Repeat only",
        type: "boolean",
        required: false,
        helpText:
          "In combination with the above, do not trigger on new measurements themselves.",
      },
    ],
    perform,
    sample: {
      id: "bdbe300d02ac08351fb8e4d8a86156f2",
      FactoryTimestamp: "2022-05-21T01:39:50.000Z",
      type: 0,
      ValueInMgPerDl: 117,
      ValueInMmolPerL: 6.5,
      TrendArrow: 3,
      TrendMessage: null,
      MeasurementColor: 1,
      MeasurementColorFormatted: "green",
      GlucoseUnits: 1,
      GlucoseUnitsFormatted: "mg/dl",
      Value: 117,
      isHigh: false,
      isLow: false,
      isInRange: true,
    },
  },
};
