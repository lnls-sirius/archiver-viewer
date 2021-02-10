import DataExportInterface, { DataExportModule } from "./DataExportInterface";
import DataExportModuleXLSX from "./DataExportXLSXModule";

class DataExport implements DataExportInterface {
  asXlsx: DataExportModule = DataExportModuleXLSX;
  asCsv: DataExportModule = async (datasets: any) => {
    throw "CSV export not available";
  };
}
export default DataExport;
