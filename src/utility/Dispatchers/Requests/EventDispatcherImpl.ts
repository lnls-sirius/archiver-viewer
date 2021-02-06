import ui from "../../../lib/ui";
import store from "../../../store";
import { actions } from "../../../features/requests";
import RequestsDispatcher from "./RequestsDispatcher";

class RequestsDispatcherImpl implements RequestsDispatcher {
  Warning(message: string, error?: any): void {
    throw new Error("Method not implemented.");
  }
  IncrementActiveRequests(): void {
    store.dispatch(actions.increment());
  }
  DecrementActiveRequests(): void {
    store.dispatch(actions.decrement());
  }
  Error(message: string, error?: any): void {
    ui.toggleSearchWarning(message);
    store.dispatch(actions.setError({ date: new Date(), msg: message }));
  }
}
export default RequestsDispatcherImpl;
