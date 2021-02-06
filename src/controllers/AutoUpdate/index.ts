import AutoUpdateFunctionInterface from "./AutoUpdateFunctionInterface";
import AutoUpdateInterface from "./AutoUpdateInterface";
import AutoUpdateImpl from "./AutoUpdateImpl";

const makeAutoUpdate = (autoUpdateFunction: AutoUpdateFunctionInterface): AutoUpdateInterface => {
  return new AutoUpdateImpl(autoUpdateFunction);
};
export default makeAutoUpdate;
