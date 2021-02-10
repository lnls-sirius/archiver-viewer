import { ChartDrag, ChartDragFlags } from "./interface";

class ChartDragImpl implements ChartDrag {
  startDrag(): void {
    this.dragFlags.dragStarted = true;
  }
  stopDrag(): void {
    this.dragFlags.dragStarted = false;
  }
  updateDragEndTime(t: Date): void {
    this.dragFlags.endTime = t;
  }
  updateDragOffsetX(x: number): void {
    this.dragFlags.x = x;
  }
  private dragFlags: ChartDragFlags = {
    dragStarted: false,
    updateOnComplete: true,
    endTime: undefined,
  };
}
export default ChartDragImpl;
