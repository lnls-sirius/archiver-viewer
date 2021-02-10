import StatusDispatcherImpl from "./impl";
import StatusDispatcher from "./interface";

const eventDispatch: StatusDispatcher = new StatusDispatcherImpl();
export default eventDispatch;
