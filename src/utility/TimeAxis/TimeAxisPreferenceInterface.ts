interface TimeAxisPreferenceInterface {
  getText(): string;
  getUnit(): string;
  getUnitStepSize(): number;
  isOptimized(): boolean;
  setOptimized(optimized: boolean): void;
  isDrifted(): boolean;
  setDrifted(drifted: boolean): void;
  getBins(): number;
  getTimeInMilliseconds(): number;
}

export default TimeAxisPreferenceInterface;
