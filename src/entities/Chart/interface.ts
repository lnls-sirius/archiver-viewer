import { ArchiverMetadata } from "../../data-access/interface";

interface ChartInterface {
  appendDataset(data: any[], optimized: boolean, drift: boolean, bins: number, metadata: ArchiverMetadata): void;
  updateTimeAxis(start?: Date, end?: Date): void;
}
export default ChartInterface;
