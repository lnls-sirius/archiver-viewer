import AutoUpdateInterface from "./AutoUpdateInterface";
import AutoUpdateFunctionInterface from "./AutoUpdateFunctionInterface";

import store from "../../store";
import { actions } from "../../features/chart";

const { setAutoScroll } = actions;
class AutoUpdateImpl implements AutoUpdateInterface {
  private state = false;
  private UPDATE_INTERVAL = 5 * 1000;
  private timerRef: any;
  private updateFunction: AutoUpdateFunctionInterface;

  constructor(updateFunction: AutoUpdateFunctionInterface) {
    this.updateFunction = updateFunction;
  }

  private setState(newState: boolean): void {
    this.state = newState;
    store.dispatch(setAutoScroll(this.state));
  }

  isEnabled(): boolean {
    return this.state;
  }

  setEnabled(): void {
    this.timerRef = setInterval(this.updateFunction, this.UPDATE_INTERVAL);
    this.setState(true);
  }

  setDisabled(): void {
    clearInterval(this.timerRef);
    this.setState(false);
  }

  toggle(): void {
    this.setState(!this.state);
  }
}
export default AutoUpdateImpl;
