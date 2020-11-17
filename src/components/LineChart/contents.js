import chartUtils from "../../lib/chartUtils";
import { TIME_AXIS_ID } from "../../lib/timeAxisPreferences";
import handlers from "../../lib/handlers";

export const options = {
  showLine: true,
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
      tension: 0, // disable belzier curves
    },
  },
  tooltips: {
    mode: "nearest",
    axis: "x",
    intersect: false,
    custom: handlers.tooltipColorHandler,
    cornerRadius: 5,
    caretSize: 0,
    yAlign: "no-transform",
    xAlign: "no-transform",
    position: "cursor",
    callbacks: {
      label: chartUtils.labelCallback,
      beforeBody: handlers.bodyCallback,
    },
  },
  hover: {
    mode: "nearest",
    position: "nearest",
    intersect: false,
    animationDuration: 0,
  },
  title: { display: false },
  scales: {
    B: {
      display: false,
      min: 0,
      max: 10,
    },
    xAxes: [
      {
        // Common x axis
        offset: true,
        id: TIME_AXIS_ID,
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
          // maxTicksLimit: 15
        },
      },
    ],
    yAxes: [
      {
        // Useless YAxis
        type: "linear",
        display: false,
        position: "left",
        id: "y-axis-0",
      },
    ],
  },
  legend: {
    display: false,
    onClick: chartUtils.legendCallback,
  },
};
