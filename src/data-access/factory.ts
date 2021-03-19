import { DataAccessFactory } from "./interface";
import { ArchiverDataAccess } from "./impl";

const ArchiverDataAccessFactory: DataAccessFactory = () => {
  return new ArchiverDataAccess();
};
export default ArchiverDataAccessFactory;
