import store from "../../../store";
import { actions } from "../../../features/requests";
import RequestsDispatcher from "./interface";

class RequestsDispatcherImpl implements RequestsDispatcher {
  IncrementActiveRequests(): void {
    store.dispatch(actions.increment());
  }
  DecrementActiveRequests(): void {
    store.dispatch(actions.decrement());
  }
}
export default RequestsDispatcherImpl;
