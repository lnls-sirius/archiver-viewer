import RequestsDispatcherImpl from "./EventDispatcherImpl";
import RequestsDispatcher from "./RequestsDispatcher";

const eventDispatch: RequestsDispatcher = new RequestsDispatcherImpl();
export default eventDispatch;
