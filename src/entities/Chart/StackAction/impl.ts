import { ChartActionsStack, StackAction } from "./interface";

class ChartActionsStackImpl implements ChartActionsStack {
  private undoStack: StackAction[] = [];
  private redoStack: StackAction[] = [];

  redoStackPop(): StackAction {
    return this.redoStack.pop();
  }
  redoStackPush(state: StackAction): void {
    this.redoStack.push(state);
  }

  undoStackPop(): StackAction {
    return this.undoStack.pop();
  }
  undoStackPush(state: StackAction): void {
    this.undoStack.push(state);
  }
}
export default ChartActionsStackImpl;
