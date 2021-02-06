import ActionsStackInterface, {
  StackRedoInterface,
  StackUndoInterface,
  ActionPayloadInterface,
} from "./ActionsStackInterface";
import { StackAction } from "./ActionsStackConstants";

class ActionStackHandler implements ActionsStackInterface {
  private stack: ActionPayloadInterface[] = [];

  getUndoHandler(): StackUndoInterface {
    throw new Error("Method not implemented.");
  }
  getRedoHandler(): StackRedoInterface {
    throw new Error("Method not implemented.");
  }
}
