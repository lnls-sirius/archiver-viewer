import { ArchiverMetadata } from "../../data-access/interface";

interface ChartInterface {
  appendDataset(data: any[], optimized: boolean, diff: boolean, bins: number, color: string, metadata: ArchiverMetadata): void;
  updateTimeAxis(start?: Date, end?: Date): void;
}
export default ChartInterface;
