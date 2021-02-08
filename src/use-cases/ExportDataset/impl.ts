import ExportDataset from "./interface";
import DataExportInterface from "../../controllers/DataExport/DataExportInterface";
import control from "../../entities/Chart/Chart";
import { StatusDispatcher } from "../../utility/Dispatchers";

class ExportDatasetImpl implements ExportDataset {
  private dataExportStrategy: DataExportInterface;

  constructor(dataExportStrategy: DataExportInterface) {
    this.dataExportStrategy = dataExportStrategy;
  }

  async asXlsx(): Promise<void> {
    if (control.isAutoUpdateEnabled()) {
      const msg = "Cannot export data while auto is enabled";
      console.error(msg);
      StatusDispatcher.Warning("Data export", msg);
      return;
    }
    const datasets = control.chart().data.datasets;
    await this.dataExportStrategy.asXlsx(datasets);
  }
}
export default ExportDatasetImpl;
