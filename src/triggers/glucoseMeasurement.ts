import { Bundle, ZObject } from "zapier-platform-core";
import {
  doesMeasurementMatchRange,
  enrichMeasurement,
  findConnectionInResponseForPatientId,
  hash,
} from "../utils";
import { EnrichedMeasurement, RangeInputField } from "../types";

const perform = async (
  z: ZObject,
  bundle: Bundle<{
    patientId: string;
    range: RangeInputField;
    minutesSince: null | string;
  }>
): Promise<EnrichedMeasurement[]> => {
  const response = await z.request("/llu/connections");
  const connection = findConnectionInResponseForPatientId(
    response,
    bundle.inputData.patientId
  );

  const enrichedMeasurement = {
    ...enrichMeasurement(connection.glucoseMeasurement, connection.alarmRules),
    __response: response,
  };

  if (bundle.meta.isLoadingSample) {
    return [enrichedMeasurement];
  }

  if (!doesMeasurementMatchRange(enrichedMeasurement, bundle.inputData.range)) {
    return [];
  }

  const minutesSince = bundle.inputData.minutesSince
    ? Number.parseInt(bundle.inputData.minutesSince, 10)
    : null;

  if (!minutesSince || Number.isNaN(minutesSince)) {
    return [enrichedMeasurement];
  }

  const storeResponse = await z.request({
    url: "https://store.zapier.com/api/records",
    method: "GET",
  });

  const CurrentTimestampDate = new Date();

  if (storeResponse.data.TriggerTimestamp) {
    const TriggerTimestampDate = new Date(storeResponse.data.TriggerTimestamp);

    if (
      CurrentTimestampDate.getTime() - TriggerTimestampDate.getTime() <
      minutesSince * 60 * 1000
    ) {
      return [];
    }
  }

  await z.request({
    url: "https://store.zapier.com/api/records",
    method: "POST",
    json: {
      TriggerTimestamp: CurrentTimestampDate.toISOString(),
    },
  });

  return [
    {
      ...enrichedMeasurement,
      id: hash(
        `${enrichedMeasurement.FactoryTimestamp}:${CurrentTimestampDate}`
      ),
    },
  ];
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
