import { createHash } from "crypto";
import {
  AlarmRules,
  ConnectionsResponse,
  EnrichedMeasurement,
  RangeInputField,
  ResponseMeasurement,
} from "./types";
import {
  MEASUREMENT_COLOR,
  TREND_ARROW_DIRECTION,
  TREND_ARROW_ICON,
} from "./constants";
import { HttpResponse } from "zapier-platform-core";

export const hash = (value: string) =>
  createHash("md5").update(value).digest("hex");

export const getValueInMmolPerL = (ValueInMgPerDl: number): number =>
  ValueInMgPerDl / 18;

export const enrichMeasurement = (
  { Timestamp, ...measurement }: ResponseMeasurement,
  alarmRules: AlarmRules
): EnrichedMeasurement => {
  const isHigh = measurement.ValueInMgPerDl > alarmRules.h.th;
  const isLow = measurement.ValueInMgPerDl < alarmRules.l.th;

  return {
    ...measurement,
    id: hash(measurement.FactoryTimestamp),
    FactoryTimestamp: new Date(
      `${measurement.FactoryTimestamp} UTC`
    ).toISOString(),
    ValueInMmolPerL: getValueInMmolPerL(measurement.ValueInMgPerDl),
    TrendArrowDirection: TREND_ARROW_DIRECTION[measurement.TrendArrow],
    TrendArrowIcon: TREND_ARROW_ICON[measurement.TrendArrow],
    GlucoseUnitsFormatted: measurement.GlucoseUnits === 1 ? "mg/dl" : "mmol/l",
    MeasurementColorFormatted: MEASUREMENT_COLOR[measurement.MeasurementColor],
    isHigh,
    isLow,
    isInRange: !(isLow || isHigh),
  };
};

export const doesMeasurementMatchRange = (
  measurement: EnrichedMeasurement,
  range: RangeInputField
) =>
  !range ||
  (range === "isHigh" && measurement.isHigh) ||
  (range === "isLow" && measurement.isLow) ||
  (range === "isInRange" && measurement.isInRange) ||
  (range === "isNotInRange" && !measurement.isInRange);

export const findConnectionInResponseForPatientId = (
  response: HttpResponse,
  patientId: string
) => {
  const data = response.data as ConnectionsResponse;

  const connection = data.data.find(
    (connection) => connection.patientId === patientId
  );

  if (!connection) {
    throw new Error(`No connection found for patientId ${patientId}`);
  }

  return connection;
};
