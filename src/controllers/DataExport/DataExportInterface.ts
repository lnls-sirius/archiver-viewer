import { ArchiverDataPoint } from "../../data-access/interface";
import { DatasetInfo } from "../../entities/Chart/ChartJS";

export interface DataExportModule {
  (datasets: { metadata: DatasetInfo; data: ArchiverDataPoint[] }[]): Promise<void>;
}
interface DataExportInterface {
  asXlsx: DataExportModule;
  asCsv: DataExportModule;
}
export default DataExportInterface;
