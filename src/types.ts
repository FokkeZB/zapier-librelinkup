import {
  MEASUREMENT_COLOR,
  TREND_ARROW_DIRECTION,
  TREND_ARROW_ICON,
} from "./constants";

type TrendArrow = keyof typeof TREND_ARROW_ICON;
type TrenArrowIcon = (typeof TREND_ARROW_ICON)[TrendArrow];
type TrendArrowDirection = (typeof TREND_ARROW_DIRECTION)[TrendArrow];

type MeasurementColor = keyof typeof MEASUREMENT_COLOR;
type MeasurementColorFormatted = (typeof MEASUREMENT_COLOR)[MeasurementColor];

export interface ResponseMeasurement {
  FactoryTimestamp: string; // "5/21/2022 1:38:50 PM";
  Timestamp: string; // "5/21/2022 3:38:50 PM";
  type: number; // 1;
  ValueInMgPerDl: number; // 91;
  ValueInMmolPerL: number; // 5.05;
  TrendArrow: TrendArrow; // 3;
  TrendMessage: string | null;
  MeasurementColor: MeasurementColor;
  GlucoseUnits: number; // 1;
  Value: number; // 91;
  isHigh: boolean;
  isLow: boolean;
}

export type EnrichedMeasurement = Omit<ResponseMeasurement, "Timestamp"> & {
  id: string; // "bdbe300d02ac08351fb8e4d8a86156f2";
  ValueInMmolPerL: number;
  TrendArrowIcon: TrenArrowIcon;
  TrendArrowDirection: TrendArrowDirection;
  MeasurementColorFormatted: MeasurementColorFormatted;
  GlucoseUnitsFormatted: "mg/dl" | "mmol/l";
  isInRange: boolean;
};

export type GlucoseMeasurement = EnrichedMeasurement & {
  isRepeat: null | boolean;
  repeatCount: null | number;
  _response: string;
};

export type AlarmRules = {
  h: {
    th: number;
    thmm: number;
  };
  l: {
    th: number;
    thmm: number;
  };
};

// https://gist.github.com/khskekec/6c13ba01b10d3018d816706a32ae8ab2#get-connections
export type ConnectionsResponse = {
  status: 0;
  data: [
    {
      patientId: string;
      firstName: string;
      lastName: string;
      targetLow: number;
      targetHight: number;
      glucoseMeasurement: ResponseMeasurement;
      glucoseItem: ResponseMeasurement;
      alarmRules: AlarmRules;
      patientDevice: {
        ll: number;
        hl: number;
      };
    }
  ];
};

export type RangeInputField =
  | null
  | "isHigh"
  | "isLow"
  | "isInRange"
  | "isNotInRange";
