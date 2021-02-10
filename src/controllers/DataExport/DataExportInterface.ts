export interface DataExportModule {
  (datasets: any): Promise<void>;
}
interface DataExportInterface {
  asXlsx: DataExportModule;
  asCsv: DataExportModule;
}
export default DataExportInterface;
