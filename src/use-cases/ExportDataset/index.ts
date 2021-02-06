import ExportDataset from "./interface";
import ExportDatasetImpl from "./impl";

import DataExport from "../../controllers/DataExport";

const exportDataset: ExportDataset = new ExportDatasetImpl(DataExport);
export default exportDataset;
