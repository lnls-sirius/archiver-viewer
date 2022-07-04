import StatusDispatcherInterface from "./interface";
import store from "../../../store";
import { actions as actionsShortcuts} from "../../../features/shortcuts";
class ShortcutsDispatcherImpl implements StatusDispatcherInterface {
  KeyPress(key: string): void {
    store.dispatch(actionsShortcuts.setKeys(key));
  }
  KeyRelease(key: string): void {
    store.dispatch(actionsShortcuts.unsetKey(key));
  }
  setInfoVisible(visible: boolean): void {
    store.dispatch(actionsShortcuts.setInfoResultsVisible(visible));
  }
}
export default ShortcutsDispatcherImpl;
