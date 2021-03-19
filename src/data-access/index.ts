import { DataAccess } from "./interface";
import ArchiverDataAccessFactory from "./factory";

const archInterface: DataAccess = ArchiverDataAccessFactory();
export default archInterface;
