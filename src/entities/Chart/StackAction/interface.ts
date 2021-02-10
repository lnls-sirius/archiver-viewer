import { StackActionEnum } from "./constants";
export interface StackAction {
  action: StackActionEnum;
  pv?: string;
  endTime?: Date;
  startTime?: Date;
  optimized?: boolean;
  windowTime?: number;
}
export interface ChartActionsStack {
  redoStackPop(): StackAction;
  redoStackPush(state: StackAction): void;

  undoStackPop(): StackAction;
  undoStackPush(state: StackAction): void;
}
