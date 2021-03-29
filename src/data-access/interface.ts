export interface ArchiverDataPoint {
  x: Date;
  y: number;
  severity: number;
  status: number;
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
  DBRType:
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
