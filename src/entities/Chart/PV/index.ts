interface Color {
  setColor(red: number, green: number, blue: number, alpha: number): void;
  toString(): string;
}
class ColorImpl implements Color {
  private red: number;
  private green: number;
  private blue: number;
  private alpha: number;

  constructor(red: number, green: number, blue: number, alpha = 1) {
    this.setColor(red, green, blue, alpha);
  }

  setColor(red: number, green: number, blue: number, alpha = 1) {
    this.alpha = alpha;
    this.red = red;
    this.green = green;
    this.blue = blue;
  }

  toString(): string {
    return `rgba(${this.red},${this.green},${this.blue},${this.alpha})`;
  }
}

class PV {
  name: string;
  // private color: Color;
  color: string;
  egu: string;
  prec: number;
  type: string;

  optimized: boolean;
  binSize: number;

  constructor(name: string) {
    this.name = name;
  }

  /* setColor(color: Color): void {
    this.color = color;
  } */

  // private eguNormalize(): void {}
}

class Series {
  private name: string;
  private minValue: number;
  private maxValue: number;
  // private axisType:
}

export const pvs = new Map<string, PV>();

export default PV;
