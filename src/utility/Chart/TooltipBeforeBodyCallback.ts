import { ChartDataSets, ChartType, Point } from "chart.js";

function closestDateValue(searchDate: Date, dates: Date[]) {
  if (searchDate.valueOf() - dates[0].valueOf() <= 0) {
    return 0;
  } else if (searchDate.valueOf() - dates[dates.length - 1].valueOf() >= 0) {
    return dates.length - 1;
  }

  let first = 0;
  let last = dates.length - 1;
  let middle;

  while (first <= last) {
    middle = Math.floor((first + last) / 2);

    if (dates[middle] === searchDate) {
      return middle;
    }

    if (first === middle) {
      return first.valueOf() < searchDate.valueOf() ? first : first - 1;
    }

    if (dates[middle] > searchDate) {
      last = middle - 1;
    } else {
      first = middle + 1;
    }
  }
}

interface IsSingleTooltipEnabled {
  (): boolean;
}
const makeBodyCallback = (isSingleTooltipEnabled: IsSingleTooltipEnabled): any => {
  /*
   * Handles tooltip item list correction and addition
   */
  const bodyCallback = function (labels: Chart.ChartTooltipItem[], chart: Chart.ChartData): string | string[] {
    if (isSingleTooltipEnabled()) {
      return;
    }
   /* const datasets: ChartDataSets[] = chart.datasets;
    const drawnDatasets = labels.map((x) => x.datasetIndex);
    const masterSet = labels[0].datasetIndex;
    const stringDate = labels[0].xLabel.substring(0, 23);

    labels[0].backgroundColor = datasets[masterSet].backgroundColor;
    labels[0].borderColor = datasets[masterSet].borderColor;

    const masterDate = new Date(stringDate);
    let index = 1;

    for (let i = 0; i < datasets.length; i++) {
      if (i !== masterSet) {
        const closest = closestDateValue(
          masterDate,
          datasets[i].data.map((x) => x.x)
        );

        const closestPoint = datasets[i].data[closest] as Chart.ChartPoint;
        if (datasets[i].data[closest] === undefined) {
          return "Loading datasets...";
        }

        if (drawnDatasets.includes(i)) {
          labels[index].yLabel = closestPoint.y;
          labels[index].x = labels[0].x;
          labels[index].y = closestPoint.y;
          labels[index].backgroundColor = datasets[i].backgroundColor;
          labels[index].borderColor = datasets[i].borderColor;
          index++;
        } else {
          labels.push({
            datasetIndex: i,
            index: closest,
            label: closestPoint.x.toString(),
            value: closestPoint.y.toString(),
            x: labels[0].x,
            xLabel: labels[0].xLabel,
            y: labels[0].y,
            yLabel: closestPoint.y,
            backgroundColor: datasets[i].backgroundColor || "#fff",
            borderColor: datasets[i].borderColor || "#fff",
          });
        }
      }
    }
*/
    labels.sort(function (a: any, b: any) {
      return a.datasetIndex - b.datasetIndex;
    });
  };
};
export default makeBodyCallback;
