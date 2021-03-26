/* eslint-disable radix */
import PlotPVs, { PlotPVParams } from "./interface";
import control from "../../entities/Chart";
import archInterface from "../../data-access";
// import chartUtils from "../../entities/chartUtils";
import { RequestsDispatcher, StatusDispatcher } from "../../utility/Dispatchers";
import { fixOutOfRangeData } from "../../utility/data";
import { OptimizeDataError } from "../../utility/errors";

import Chart from "chart.js";
import { ArchiverMetadata } from "../../data-access/interface";

class PlotPVsImpl implements PlotPVs {
  private update(): void {
    (control.getChart() as Chart).update({ duration: 0, easing: "linear", lazy: false });
    control.updateOptimizedWarning();
  }

  private async getPVMetadata(pv: string): Promise<ArchiverMetadata | null> {
    // Ask for the PV's metadata
    return await archInterface.fetchMetadata(pv).catch((err) => {
      console.log("Fetch metadata Exception", err);
      return null;
    });
  }

  private async fetchAndInsertPV(
    pv: string,
    optimized: boolean,
    bins: number,
    metadata: ArchiverMetadata
  ): Promise<void> {
    const start: Date = control.getStart();
    const end: Date = control.getEnd();

    RequestsDispatcher.IncrementActiveRequests();

    try {
      const res = await archInterface.fetchData(pv, start, end, optimized, bins);
      const { data } = res;

      const _data = fixOutOfRangeData(data, control.getStart(), control.getEnd());
      control.appendDataset(_data, optimized, bins, metadata);
    } catch (e) {
      let msg: string;

      if (e instanceof OptimizeDataError) {
        msg = `Failed to retrieve optimized data for ${pv} using optimize_${bins} [${start}, ${end}]`;
        await this.fetchAndInsertPV(pv, false, -1, metadata);

        console.warn(msg);
        StatusDispatcher.Warning("Append PV: Fetch data", msg);
      } else {
        msg = `Failed to retrieve data for ${pv} [${start}, ${end}]`;
        console.error(msg);
        StatusDispatcher.Error("Append PV: Fetch data", msg);
      }
    } finally {
      RequestsDispatcher.DecrementActiveRequests();
    }
  }

  private async appendPV(pv: string, optimize?: boolean, bins = 1200): Promise<void> {
    const metadata = await this.getPVMetadata(pv);

    await this.fetchAndInsertPV(pv, optimize, bins, metadata);

    control.updateOptimizedWarning();
    control.updateURL();
  }

  plotPV({ name, optimize, bins, updateChart }: PlotPVParams): void {
    const pvIndex = control.getPlotIndex(name);
    const shouldUpdateExistingPV = pvIndex !== null;
    if (shouldUpdateExistingPV) {
      control.updatePlot(pvIndex);
    } else {
      this.appendPV(name, optimize, bins);
    }
    if (updateChart === true) {
      this.update();
    }
  }

  plot(pvs: PlotPVParams[]): void {
    pvs.forEach((params) => this.plotPV(params));
    this.update();
  }
}

export default PlotPVsImpl;
