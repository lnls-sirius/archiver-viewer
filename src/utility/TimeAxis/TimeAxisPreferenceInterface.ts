interface TimeAxisPreferenceInterface {
  getText(): string;
  getUnit(): string;
  getUnitStepSize(): number;
  isOptimized(): boolean;
  setOptimized(optimized: boolean): void;
  isdiffted(): boolean;
  setdiffted(diffted: boolean): void;
  getBins(): number;
  getTimeInMilliseconds(): number;
}

export default TimeAxisPreferenceInterface;
