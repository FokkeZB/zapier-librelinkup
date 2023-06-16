import { Bundle, ZObject } from "zapier-platform-core";
import { enrichMeasurement, getValueInMmolPerL } from "../utils";
import { ConnectionsResponse } from "../types";

const perform = async (z: ZObject, _bundle: Bundle) => {
  const response = await z.request("/llu/connections");
  const data = response.data as ConnectionsResponse;

  return data.data.map((connection) => ({
    ...connection,
    fullName: `${connection.firstName} ${connection.lastName}`,
    targetLowMm: getValueInMmolPerL(connection.targetLow),
    targetHighMm: getValueInMmolPerL(connection.targetHight),
    glucoseMeasurement: enrichMeasurement(
      connection.glucoseMeasurement,
      connection.patientDevice.ll,
      connection.patientDevice.hl
    ),
    glucoseItem: enrichMeasurement(
      connection.glucoseItem,
      connection.patientDevice.ll,
      connection.patientDevice.hl
    ),
  }));
};

export default {
  key: "connection",
  noun: "Connection",

  display: {
    label: "New Connection",
    description: "Triggers when a new connection is created.",
  },

  operation: {
    perform,
    sample: {
      id: "xxxxx",
      patientId: "xxxxxxx",
      country: "DE",
      status: 2,
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      targetLow: 70,
      targetLowMm: 3.9,
      targetHigh: 130,
      targetHighMm: 7.2,
      uom: 1,
      sensor: {
        deviceId: "",
        sn: "xxxxx",
        a: 1652400270,
        w: 60,
        pt: 4,
      },
      alarmRules: {
        c: true,
        h: {
          on: true,
          th: 130,
          thmm: 7.2,
          d: 1440,
          f: 0.1,
        },
        f: {
          th: 55,
          thmm: 3,
          d: 30,
          tl: 10,
          tlmm: 0.6,
        },
        l: {
          on: true,
          th: 70,
          thmm: 3.9,
          d: 1440,
          tl: 10,
          tlmm: 0.6,
        },
        nd: {
          i: 20,
          r: 5,
          l: 6,
        },
        p: 5,
        r: 5,
        std: {},
      },
      glucoseMeasurement: {
        FactoryTimestamp: "2022-05-21T01:39:50.000Z",
        type: 1,
        ValueInMgPerDl: 91,
        ValueInMmolPerL: 5.05,
        TrendArrow: 3,
        TrendMessage: null,
        MeasurementColor: 1,
        MeasurementColorFormatted: "green",
        GlucoseUnits: 1,
        GlucoseUnitsFormatted: "mg/dl",
        Value: 91,
        isHigh: false,
        isLow: false,
        isInRange: true,
      },
      glucoseItem: {
        FactoryTimestamp: "2022-05-21T01:39:50.000Z",
        type: 1,
        ValueInMgPerDl: 91,
        ValueInMmolPerL: 5.05,
        TrendArrow: 3,
        TrendMessage: null,
        MeasurementColor: 1,
        MeasurementColorFormatted: "green",
        GlucoseUnits: 1,
        GlucoseUnitsFormatted: "mg/dl",
        Value: 91,
        isHigh: false,
        isLow: false,
        isInRange: true,
      },
      glucoseAlarm: null,
      patientDevice: {
        did: "2d97357e-d250-11ec-b409-0242ac110004",
        dtid: 40068,
        v: "3.3.1",
        ll: 65,
        hl: 130,
        u: 1653016896,
        fixedLowAlarmValues: {
          mgdl: 60,
          mmoll: 3.3,
        },
        alarms: false,
      },
      created: 1652399545,
    },
  },
};
