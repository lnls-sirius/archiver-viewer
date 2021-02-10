export interface ArchiverDataPoint {
  x: Date;
  y: number;
  severity: number;
  status: number;
}
export interface ArchiverData {
  meta: { name: string; PREC: string };
  data: ArchiverDataPoint[];
}
export interface DataAccess {
  query(search: string): Promise<string[]>;
  getUrl(): string;
  setUrl(url: string): void;
  fetchMetadata(pv: string): Promise<null | []>;
  fetchData(pv: string, from: Date, to: Date, isOptimized?: boolean, bins?: number): Promise<ArchiverData>;
  getRemoteDate(): Promise<Date>;
}

export interface DataAccessFactory {
  (): DataAccess;
}
