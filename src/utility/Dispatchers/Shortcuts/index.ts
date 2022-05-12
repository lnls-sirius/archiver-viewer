import ShortcutsDispatcherImpl from "./impl";
import ShortcutsDispatcher from './interface';

const eventDispatch: ShortcutsDispatcher = new ShortcutsDispatcherImpl();
export default eventDispatch;
