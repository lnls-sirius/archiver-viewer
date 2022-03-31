import TimeAxisPreferenceInterface from "./TimeAxisPreferenceInterface";
import { TimeUnits } from "./TimeAxisConstants";
class TimeAxisPreference implements TimeAxisPreferenceInterface {
  private text: string;
  private unit: TimeUnits;
  private unitStepSize: number;
  private ms: number;
  private optimized: boolean;
  private drift: boolean;
  private bins: number;
  private timeInterval: number;

  constructor(unit: TimeUnits, timeInterval: number, unitStepSize: number, defaultOptimized: boolean, defaultDrift: boolean, bins: number) {
    this.unit = unit;
    this.unitStepSize = unitStepSize;
    this.bins = bins;
    this.timeInterval = timeInterval;
    this.optimized = defaultOptimized;
    this.drift = defaultDrift;

    this.text = this.generateText();
    this.ms = this.parseTimeIntervalToMs();
  }

  private generateText(): string {
    let nSufix = "";
    switch (this.unit) {
      case TimeUnits.Year:
        nSufix = "Y";
        break;
      case TimeUnits.Month:
        nSufix = "M";
        break;
      case TimeUnits.Week:
        nSufix = "w";
        break;
      case TimeUnits.Day:
        nSufix = "d";
        break;
      case TimeUnits.Hour:
        nSufix = "h";
        break;
      case TimeUnits.Minute:
        nSufix = "m";
        break;
      case TimeUnits.Second:
        nSufix = "s";
        break;

      default:
        throw `Conversion not impplemented for time unit ${this.unit}`;
    }

    return `${this.timeInterval}${nSufix}`;
  }

  private parseTimeIntervalToMs(): number {
    switch (this.unit) {
      case TimeUnits.Month:
        return this.timeInterval * 30 * 24 * 3600 * 1000;

      case TimeUnits.Week:
        return this.timeInterval * 7 * 24 * 3600 * 1000;

      case TimeUnits.Day:
        return this.timeInterval * 24 * 3600 * 1000;
      case TimeUnits.Hour:
        return this.timeInterval * 3600 * 1000;

      case TimeUnits.Minute:
        return this.timeInterval * 60 * 1000;

      case TimeUnits.Second:
        return this.timeInterval * 1000;

      default:
        throw `Conversion not impplemented for time unit ${this.unit}`;
    }
  }

  getTimeInMilliseconds(): number {
    return this.ms;
  }

  getUnitStepSize(): number {
    return this.unitStepSize;
  }

  isOptimized(): boolean {
    return this.optimized;
  }

  setOptimized(optimized: boolean): void {
    this.optimized = optimized;
  }

  isDrifted(): boolean {
    return this.drift;
  }

  setDrifted(drifted: boolean): void {
    this.drift = drifted;
  }

  getBins(): number {
    return this.bins;
  }

  getText(): string {
    return this.text;
  }

  getUnit(): string {
    return this.unit;
  }
}
export default TimeAxisPreference;
