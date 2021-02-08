import Browser from "../Browser";
import control from "../../entities/Chart/Chart";
import PlotPVs from "../../use-cases/PlotPVs";
import chartUtils from "../../utility/chartUtils";

interface UrlLoader {
  load(): Promise<void>;
}
class UrlLoaderImpl implements UrlLoader {
  async load(): Promise<void> {
    const { pvs, from, to } = Browser.getConfigFromUrl();

    if (from) {
      control.setStart(new Date(from));
    }

    if (to) {
      control.setEnd(new Date(to));
    }

    if (to && from) {
      const newWindowTime = control.getNewTimeWindow();
      control.updateTimeWindowOnly(newWindowTime);
    } else {
      await control.updateStartAndEnd(new Date());
    }
    const windowTime: number = control.windowTime();
    chartUtils.updateTimeAxis(
      control.chart(),
      chartUtils.timeAxisPreferences[windowTime].unit,
      chartUtils.timeAxisPreferences[windowTime].unitStepSize,
      control.start(),
      control.end()
    );

    for (let i = 0; i < pvs.length; i++) {
      let optimized = false;

      if (pvs[i].indexOf("optimized_") !== -1) {
        pvs[i] = pvs[i].substr(pvs[i].indexOf("(") + 1);
        pvs[i] = pvs[i].substr(0, pvs[i].indexOf(")"));
        optimized = true;
      }

      PlotPVs.plotPV(pvs[i], optimized, true);
    }
  }
}

const urlLoader: UrlLoader = new UrlLoaderImpl();

export default urlLoader;
