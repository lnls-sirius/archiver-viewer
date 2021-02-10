export interface ChartDragFlags {
  dragStarted: boolean;
  updateOnComplete: boolean;
  endTime?: Date;
  x?: number;
}
export interface ChartDrag {
  startDrag(): void;
  stopDrag(): void;
  updateDragEndTime(t: Date): void;
  updateDragOffsetX(x: number): void;
}
