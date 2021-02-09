import ActionsStackInterface, { StackRedoInterface, StackUndoInterface, ActionPayloadInterface } from "./interface";
import { StackAction } from "./constants";

class ActionStackHandler implements ActionsStackInterface {
  private stack: ActionPayloadInterface[] = [];

  getUndoHandler(): StackUndoInterface {
    throw new Error("Method not implemented.");
  }
  getRedoHandler(): StackRedoInterface {
    throw new Error("Method not implemented.");
  }
}
