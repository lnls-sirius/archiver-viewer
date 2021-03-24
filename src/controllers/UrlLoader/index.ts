import Browser from "../../utility/Browser";
import control from "../../entities/Chart";
import PlotPVs from "../../use-cases/PlotPVs";

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
    control.updateTimeAxis();

    for (let i = 0; i < pvs.length; i++) {
      //     const [_, bins, name] = pvs[i].match(/optimized_([0-9]+)\((.*)\)/);
      let optimize = false;
      let bins = -1;

      if (pvs[i].indexOf("optimized_") !== -1) {
        // const [_, bins, name] = pvs[i].match(/optimized_([0-9]+)\((.*)\)/);
        bins = parseFloat(pvs[i].substr("optimized_".length, pvs[i].indexOf("(") + 1));
        pvs[i] = pvs[i].substr(pvs[i].indexOf("(") + 1);
        pvs[i] = pvs[i].substr(0, pvs[i].indexOf(")"));
        optimize = true;
      }

      PlotPVs.plotPV({ name: pvs[i], optimize, bins });
    }
  }
}

const urlLoader: UrlLoader = new UrlLoaderImpl();

export default urlLoader;
