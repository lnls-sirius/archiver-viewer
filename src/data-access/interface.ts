export interface ArchiverDataPoint {
  x: Date;
  y: number;
  severity: number;
  status: number;
}
export type DBRType =
  | "DBR_SCALAR_BYTE"
  | "DBR_SCALAR_DOUBLE"
  | "DBR_SCALAR_ENUM"
  | "DBR_SCALAR_FLOAT"
  | "DBR_SCALAR_INT"
  | "DBR_SCALAR_SHORT"
  | "DBR_SCALAR_STRING"
  | "DBR_V4_GENERIC_BYTES"
  | "DBR_WAVEFORM_BYTE"
  | "DBR_WAVEFORM_DOUBLE"
  | "DBR_WAVEFORM_ENUM"
  | "DBR_WAVEFORM_FLOAT"
  | "DBR_WAVEFORM_INT"
  | "DBR_WAVEFORM_SHORT"
  | "DBR_WAVEFORM_STRING";

const GREEN_ALARM = "#00EB00";

const YELLOW_ALARM = "#EBEB00";
const RED_ALARM = "#FF0000";
const MAGENTA_ALARM = "#EB00EB";
const WHITE_ALARM = "#EBEBEB";

const SEVERITY_COLORS = [WHITE_ALARM, YELLOW_ALARM, RED_ALARM, MAGENTA_ALARM];
export function SeverityColor(severity: number): string {
  if (severity >= 0 && severity < SEVERITY_COLORS.length) {
    return SEVERITY_COLORS[severity];
  }
  return WHITE_ALARM;
}

const SeverityStrings = ["NO_ALARM", "MINOR", "MAJOR", "INVALID"];

const AlarmStrings = [
  "NO_ALARM",
  "READ",
  "WRITE",
  "HIHI",
  "HIGH",
  "LOLO",
  "LOW",
  "STATE",
  "COS",
  "COMM",
  "TIMEOUT",
  "HWLIMIT",
  "CALC",
  "SCAN",
  "LINK",
  "SOFT",
  "BAD_SUB",
  "UDF",
  "DISABLE",
  "SIMM",
  "READ_ACCESS",
  "WRITE_ACCESS",
];

export function AlarmName(n: number): string {
  if (n >= 0 && n < AlarmStrings.length) {
    return AlarmStrings[n];
  }
  return "UNKNOWN";
}

export function SeverityName(severity: number): string {
  if (severity >= 0 && severity < SeverityStrings.length) {
    return SeverityStrings[severity];
  }
  return "UNKNOWN";
}

export interface ArchiverMetadata {
  hostName: string;
  paused: boolean;
  computedEventRate: number;
  samplingMethod: "SCAN" | "MONITOR";
  samplingPeriod: number;
  applianceIdentity: string;
  pvName: string;
  scalar: boolean;

  EGU: string;
  PREC: number;
  NELM: number;
  DBRType: DBRType;
}
export interface ArchiverData {
  meta: { name: string; PREC: string };
  data: ArchiverDataPoint[];
}
export interface DataAccess {
  query(search: string): Promise<string[]>;
  getUrl(): string;
  setUrl(url: string): void;
  fetchMetadata(pv: string): Promise<null | ArchiverMetadata>;
  fetchData(pv: string, from: Date, to: Date, isOptimized?: boolean, bins?: number): Promise<ArchiverData>;
  getRemoteDate(): Promise<Date>;
}

export interface DataAccessFactory {
  (): DataAccess;
}
