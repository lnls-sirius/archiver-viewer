import { TimeAxisID } from "../../utility/TimeAxis/TimeAxisConstants";
import Chart from "chart.js";

export const options: Chart.ChartOptions = {
  showLines: true,
  spanGaps: true,
  responsiveAnimationDuration: 0,
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 0 },
  elements: {
    point: {
      hoverRadius: 0,
    },
    line: {
      cubicInterpolationMode: "monotone",
      stepped: true,
      tension: 0, // disable belzier curves
    },
  },
  hover: {
    mode: "nearest",
    intersect: false,
    animationDuration: 0,
  },
  title: { display: false },
  scales: {
    xAxes: [
      {
        // Common x axis
        offset: false,
        id: TimeAxisID,
        type: "time",
        distribution: "linear",
        time: {
          unit: "minute",
          unitStepSize: 5,
          displayFormats: {
            second: "HH:mm:ss",
            minute: "HH:mm",
            hour: "HH:ss",
            day: "MMM D hh:mm",
            month: "MMM YYYY",
          },
          tooltipFormat: "ddd MMM DD YYYY HH:mm:ss.S ZZ",
        },
        ticks: {
          source: "auto",
          autoSkip: true,
          autoSkipPadding: 5,
          maxRotation: 0,
          minRotation: 0,
          stepSize: 1,
        }
      }
    ],
    yAxes: [
      {
        // Useless YAxis
        type: "linear",
        display: false,
        position: "left",
        id: "y-axis-0",
      },
    ]
  },
  legend: {
    display: false,
  }
};
