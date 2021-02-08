import StatusDispatcherInterface from "./interface";
import store from "../../../store";
import { actions as actionsStatus, AddEntryPrepare } from "../../../features/status";
import { MessageLevel } from "../../consts/MessageLevel";

class StatusDispatcherImpl implements StatusDispatcherInterface {
  Info(title: string, message: string): void {
    const entry: AddEntryPrepare = {
      level: MessageLevel.info,
      time: new Date(),
      message,
      title,
    };
    store.dispatch(actionsStatus.addEntry(entry));
  }

  Warning(title: string, message: string): void {
    const entry: AddEntryPrepare = {
      level: MessageLevel.warn,
      time: new Date(),
      message,
      title,
    };
    store.dispatch(actionsStatus.addEntry(entry));
  }

  Error(title: string, message: string): void {
    const entry: AddEntryPrepare = {
      level: MessageLevel.error,
      time: new Date(),
      message,
      title,
    };
    store.dispatch(actionsStatus.addEntry(entry));
  }
}
export default StatusDispatcherImpl;
