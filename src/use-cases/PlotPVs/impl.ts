import PlotPVs from "./interface";
import control from "../../lib/control";
import archInterface from "../../data-access";
import chartUtils from "../../utility/chartUtils";
import { RequestsDispatcher, StatusDispatcher } from "../../utility/Dispatchers";
import Chart from "chart.js";

class PlotPVsImpl implements PlotPVs {
  private update(): void {
    (control.chart() as Chart).update({ duration: 0, easing: "linear", lazy: false });
    control.updateOptimizedWarning();
  }

  private async getPVMetadata(pv: string): Promise<any> {
    // Asks for the PV's metadata
    const metadata = await archInterface.fetchMetadata(pv).catch((err) => console.log("Fetch metadata Exception", err));
    if (metadata === null || metadata === undefined) {
      return -1;
    }
    return metadata;
  }

  private async appendPV(pv: string, optimize?: boolean): Promise<void> {
    const start: Date = control.start();
    const end: Date = control.end();
    const windowTime: number = control.windowTime();

    const metadata = await this.getPVMetadata(pv);

    let bins = control.shouldOptimizeRequest(parseFloat(metadata.samplingPeriod), metadata.DBRType);

    if (optimize === false) {
      bins = -1;
    } else if (optimize && bins === -1) {
      bins = chartUtils.timeAxisPreferences[windowTime].bins;
    }

    RequestsDispatcher.IncrementActiveRequests();
    await archInterface
      .fetchData(pv, start, end, bins < 0 ? false : true, bins)
      .then((res) => {
        const {
          meta: { PREC, name },
          data,
        } = res;

        if (res.data.length === 0) {
          throw `No data for ${name} was received from server in the interval ${start} to ${end}.`;
        }
        chartUtils.appendDataset(control.chart(), control.improveData(data), bins, parseInt(PREC) + 1, metadata);
      })
      .catch((e) => {
        const msg = `Failure ${e}`;
        console.error(msg);
        StatusDispatcher.Error("Append PV: Fetch data", msg);
      })
      .finally(() => {
        RequestsDispatcher.DecrementActiveRequests();
      });

    control.updateOptimizedWarning();
    control.updateURL();
  }

  plotPV(pv: string, optimize?: boolean, updateChart?: boolean): void {
    const pvIndex = control.getPlotIndex(pv);
    const shouldUpdateExistingPV = pvIndex !== null;

    if (shouldUpdateExistingPV) {
      control.updatePlot(pvIndex);
    } else {
      this.appendPV(pv, optimize);
    }
    if (updateChart === true) {
      this.update();
    }
  }

  plot(pvs: string[], optimize?: boolean): void {
    pvs.forEach((pv: string) => this.plotPV(pv, optimize));
    this.update();
  }
}

export default PlotPVsImpl;
