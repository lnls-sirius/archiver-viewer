export function improveData(data: any[], startTime: Date, endTime: Date): any[] {
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
}
