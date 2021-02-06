import { DataAccess } from "./interface";
import ArchiverDataAccessFactory from "./ArchiverDataAccessFactory";

const archInterface: DataAccess = ArchiverDataAccessFactory();
export default archInterface;
