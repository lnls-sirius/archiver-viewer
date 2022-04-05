import { AutoUpdate } from "./interface";
import AutoUpdateFunctionInterface from "./funcInterface";

import { ChartDispatcher } from "../../../utility/Dispatchers";

class AutoUpdateImpl implements AutoUpdate {
  private state = false;
  private UPDATE_INTERVAL = 5 * 1000;
  private timerRef: any;
  private updateFunction: AutoUpdateFunctionInterface;

  constructor(updateFunction: AutoUpdateFunctionInterface) {
    this.updateFunction = updateFunction;
  }

  private setState(newState: boolean): void {
    this.state = newState;
  }

  private async update() {
    this.updateFunction().then(async () => {
      if (this.state) {
        console.info(`Auto update: update completed, next update in ${this.UPDATE_INTERVAL / 1000}s`);
        this.timerRef = setTimeout(() => this.update(), this.UPDATE_INTERVAL);
      }
    });
  }

  isEnabled(): boolean {
    return this.state;
  }

  setEnabled(): void {
    if (!this.state) {
      console.info("Auto update: enabled");
      this.update();
    }
    this.setState(true);
  }

  setDisabled(): void {
    console.info("Auto update: disabled");

    clearTimeout(this.timerRef);
    this.setState(false);
  }

  toggle(): void {
    if (this.state) {
      this.setDisabled();
    } else {
      this.setEnabled();
    }
  }
}
export default AutoUpdateImpl;
