import ActionsStackInterface, { StackRedoInterface, StackUndoInterface, ActionPayloadInterface } from "./interface";
import { StackActionEnum } from "../../entities/Chart/StackAction/constants";

class ActionStackHandler implements ActionsStackInterface {
  private stack: ActionPayloadInterface[] = [];

  getUndoHandler(): StackUndoInterface {
    throw new Error("Method not implemented.");
  }
  getRedoHandler(): StackRedoInterface {
    throw new Error("Method not implemented.");
  }
}
