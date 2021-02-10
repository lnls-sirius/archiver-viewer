import RequestsDispatcherImpl from "./impl";
import RequestsDispatcher from "./interface";

const eventDispatch: RequestsDispatcher = new RequestsDispatcherImpl();
export default eventDispatch;
