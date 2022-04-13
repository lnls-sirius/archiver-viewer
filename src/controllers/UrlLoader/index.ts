import Browser from "../../utility/Browser";
import control from "../../entities/Chart";
import PlotPVs from "../../use-cases/PlotPVs";

interface UrlLoader {
  load(): Promise<void>;
}

const GetDelta = (hour = 12, min = 0, s = 0) => {
  const d1 = new Date();
  const d2 = new Date();
  d1.setHours(0, 0, 0);
  d2.setHours(hour, min, s);
  return new Date(d2.valueOf() - d1.valueOf());
};

const DATE_DELTA_1H = GetDelta(1);

class UrlLoaderImpl implements UrlLoader {
  async load(): Promise<void> {
    const { pvs, from, to, ref } = Browser.getConfigFromUrl();
    const timespan = { from, to, ref };

    const UpdateStartEndTimeFromUrl = () => {
      CheckIncompleteTimespan();
      CheckEqualDate();
      CheckInvertedDate();

      UpdateChartTimespan();

      function UpdateChartTimespan() {
        control.setEnd(timespan.to);
        control.setStart(timespan.from);
        control.setRefDiff(timespan.ref);

        control.updateTimeWindowOnly(control.getNewTimeWindow());
      }

      function CheckIncompleteTimespan() {
        if (from && !to) {
          timespan.to = new Date(from.valueOf() + DATE_DELTA_1H.valueOf());
        } else if (!from && to) {
          timespan.from = new Date(to.valueOf() - DATE_DELTA_1H.valueOf());
        }
      }

      function CheckEqualDate() {
        if (!from || !to) return;
        if (from.valueOf() === to.valueOf()) {
          timespan.from = new Date(to.valueOf() - GetDelta(0, 30).valueOf());
          timespan.to = new Date(to.valueOf() + GetDelta(0, 30).valueOf());
          console.warn(`Detected equal value 'to=' and 'from=', an interval will be added`);
        }
      }

      function CheckInvertedDate() {
        if (!from || !to) return;
        if (from.valueOf() > to.valueOf()) {
          timespan.from = to;
          timespan.to = from;

          console.warn(`Detected inverted 'to=' and 'from=' values '${to}', '${from}'`);
        }
      }
    };

    const UpdateRefFromUrl = () => {
      control.setRefDiff(timespan.ref);
    };

    if (!from && !to) {
      await control.updateStartAndEnd(new Date());
    } else {
      UpdateStartEndTimeFromUrl();
    }

    if (!ref) {
      await control.updateRef(new Date());
    } else {
      UpdateRefFromUrl();
    }

    control.updateTimeAxis();
    for (const data of pvs) {
      console.info(`Plotting `, data);
      PlotPVs.plotPV({ name: data.pvname, optimize: data.optimize, diff: data.diff, bins: data.bins, updateChart: true });
    }
  }
}

const urlLoader: UrlLoader = new UrlLoaderImpl();

export default urlLoader;
