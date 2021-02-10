export * from "./interface";
import AutoUpdateFunctionInterface from "./funcInterface";
import AutoUpdateImpl from "./impl";
import { AutoUpdate } from "./interface";

const makeAutoUpdate = (autoUpdateFunction: AutoUpdateFunctionInterface): AutoUpdate => {
  return new AutoUpdateImpl(autoUpdateFunction);
};
export default makeAutoUpdate;
