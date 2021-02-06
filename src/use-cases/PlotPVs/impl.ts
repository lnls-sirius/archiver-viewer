import PlotPVs from "./interface";
import control from "../../lib/control";
import archInterface from "../../data-access";
import chartUtils from "../../utility/chartUtils";
import { RequestsDispatcher } from "../../utility/Dispatchers";

class PlotPVsImpl implements PlotPVs {
  private update(): void {
    control.chart().update(0, false);
    control.updateOptimizedWarning();
  }

  private async getPVMetadata(pv: string): Promise<any> {
    // Asks for the PV's metadata
    const metadata = await archInterface.fetchMetadata(pv).catch((err) => console.log("Fetch metadata Exception", err));
    if (metadata == null) {
      //    ui.toggleSearchWarning("Failed to fetch metadata for pv " + pv);
      console.log("No metadata for ", pv);
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

    // @todo: Enable loading ...
    //   enableLoading();
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
        RequestsDispatcher.Error(msg);
      })
      .finally(() => {
        RequestsDispatcher.DecrementActiveRequests();
      });

    control.updateOptimizedWarning();
    control.updateURL();
  }

  plotPV(pv: string, optimize?: boolean, update?: boolean): void {
    const pvIndex = control.getPlotIndex(pv);
    const shouldUpdateExistingPV = pvIndex !== null;

    if (shouldUpdateExistingPV) {
      control.updatePlot(pvIndex);
    } else {
      this.appendPV(pv);
    }
    if (update === true) {
      this.update();
    }
  }

  plot(pvs: string[]): void {
    pvs.forEach((pv: string) => this.plotPV(pv));
    this.update();
  }
}

export default PlotPVsImpl;
