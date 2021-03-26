import { ArchiverDataPoint } from "../data-access/interface";

/**
 * Method used to extend the last and the first data point
 * */
export function fixOutOfRangeData(data: ArchiverDataPoint[], startTime: Date, endTime: Date): any[] {
  const unshiftData: ArchiverDataPoint[] = [];
  if (data.length > 0) {
    const first = data[0];
    const last = data[data.length - 1];

    if (first.x > startTime) {
      unshiftData.push({
        x: startTime,
        y: first.y,
        severity: first.severity,
        status: first.status,
      });
    }

    if (last.x < endTime) {
      data.push({
        x: endTime,
        y: last.y,
        severity: last.severity,
        status: last.status,
      });
    }
  }
  data.unshift(...unshiftData);
  return data;
}
