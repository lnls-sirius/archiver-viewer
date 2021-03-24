/**
 * Method used to extend the last and the first data point
 * */
export function fixOutOfRangeData(data: any[], startTime: Date, endTime: Date): any[] {
  const unshiftData = [];
  if (data.length > 0) {
    const first = data[0];
    const last = data[data.length - 1];

    if (first.x.getTime() > startTime) {
      unshiftData.push({
        x: startTime,
        y: first.y,
      });
    }

    if (last.x.getTime() < endTime) {
      data.push({
        x: endTime,
        y: last.y,
      });
    }
  }
  data.unshift(...unshiftData);
  return data;
  /*
  if (data.length === 1) {
    return data;
  }
  let idxStart = 0;
  let idxEnd = data.length - 1;

  let first = data[idxStart];
  let last = data[idxEnd];

  while (first.x.getTime() < startTime.getTime() && idxStart < idxEnd) {
    idxStart++;
    first = data[idxStart];
  }

  while (last.x.getTime() > endTime.getTime() && idxStart < idxEnd) {
    idxEnd--;
    last = data[idxEnd];
  }
  console.info(`Improve data ${idxStart} ${idxEnd}`);
  return data.slice(idxStart, idxEnd);
  */
}
