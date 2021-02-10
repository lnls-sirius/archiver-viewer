import { DataAccessFactory } from "./interface";
import { ArchiverDataAccess } from "./ArchiverDataAccess";

const ArchiverDataAccessFactory: DataAccessFactory = () => {
  return new ArchiverDataAccess();
};
export default ArchiverDataAccessFactory;
