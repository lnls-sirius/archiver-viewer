import AutoUpdateFunctionInterface from "./funcInterface";
import AutoUpdateInterface from "./interface";
import AutoUpdateImpl from "./impl";

const makeAutoUpdate = (autoUpdateFunction: AutoUpdateFunctionInterface): AutoUpdateInterface => {
  return new AutoUpdateImpl(autoUpdateFunction);
};
export default makeAutoUpdate;
