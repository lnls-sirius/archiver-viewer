/* eslint-disable radix */
import PlotPVs, { PlotPVParams } from "./interface";
import control from "../../entities/Chart";
import archInterface from "../../data-access";
// import chartUtils from "../../entities/chartUtils";
import { RequestsDispatcher, StatusDispatcher } from "../../utility/Dispatchers";
import { fixOutOfRangeData } from "../../utility/data";
import { DiffDataError, OptimizeDataError } from "../../utility/errors";

import Chart from "chart.js";
import { ArchiverMetadata } from "../../data-access/interface";
import { DefaultBinSize } from "../../utility/chartUtils";

class PlotPVsImpl implements PlotPVs {
  private update(): void {
    (control.getChart() as Chart).update({ duration: 0, easing: "linear", lazy: false });
    control.updateOptimizedWarning();
    control.updateDiffWarning();
  }

  private async getPVMetadata(pv: string): Promise<ArchiverMetadata | null> {
    // Ask for the PV's metadata
    return await archInterface.fetchMetadata(pv).catch((err): null => {
      console.log("Fetch metadata Exception", err);
      return null;
    });
  }

  private async fetchAndInsertPV(
    pv: string,
    optimized: boolean,
    diff: boolean,
    bins: number,
    color: string,
    metadata: ArchiverMetadata
  ): Promise<void> {
    const start: Date = control.getStart();
    const end: Date = control.getEnd();
    const ref: Date = control.getRefDiff();

    RequestsDispatcher.IncrementActiveRequests();

    try {
      const res = await archInterface.fetchData(pv, start, end, ref, optimized, diff, bins);
      
      const { data } = res;

      const _data = fixOutOfRangeData(data, control.getStart(), control.getEnd());
      control.appendDataset(_data, optimized, diff, bins, color, metadata);
    } catch (e) {
      let msg: string;
  
      if (e instanceof OptimizeDataError) {
        msg = `Failed to retrieve optimized data for ${pv} using optimize_${bins} [${start}, ${end}]`;
        await this.fetchAndInsertPV(pv, false, false, -1, color, metadata);

        console.warn(msg);
        StatusDispatcher.Warning("Append PV: Fetch data", msg);
      }else if (e instanceof DiffDataError) {
        msg = `Failed to retrieve diff data for ${pv} using diff [${start}, ${end}]`;
        await this.fetchAndInsertPV(pv, false, false, -1, color, metadata);

        console.warn(msg);
        StatusDispatcher.Warning("Append PV: Fetch data", msg);
      }else {
        msg = `Failed to retrieve data for ${pv} [${start}, ${end}]`;
        console.error(msg);
        StatusDispatcher.Error("Append PV: Fetch data", msg);
      }
    } finally {
      RequestsDispatcher.DecrementActiveRequests();
    }
  }

  private async appendPV(pv: string, optimize?: boolean, diff?: boolean, bins = DefaultBinSize, color?: string): Promise<void> {
    const metadata = await this.getPVMetadata(pv);

    await this.fetchAndInsertPV(pv, optimize, diff, bins, color, metadata);

    control.updateOptimizedWarning();
    control.updateDiffWarning();
    control.updateURL();
  }

  plotPV({ name, optimize, diff, bins, color, updateChart }: PlotPVParams): void {
    const pvIndex = control.getPlotIndex(name);
    const shouldUpdateExistingPV = pvIndex !== null;
    if (shouldUpdateExistingPV) {
      control.updatePlot(pvIndex);
    } else {
      this.appendPV(name, optimize, diff, bins, color);
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
