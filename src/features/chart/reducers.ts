import { PayloadAction } from "@reduxjs/toolkit";
import { DataAxis, DatasetInfo } from "../../entities/Chart/ChartJS";
import { ChartState } from "./initialState";

export function doRemoveDataAxis(state: ChartState, action: PayloadAction<string>): void {
  let index = null;
  state.dataAxis.forEach((e, idx) => {
    if (e.id === action.payload) {
      index = idx;
    }
  });
  if (index !== null) {
    state.dataAxis.splice(index, 1);
  }
}
export const addToDataAxis = {
  reducer(state: ChartState, action: any): void {
    state.dataAxis.push(action.payload);
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  prepare(data: any) {
    return {
      payload: {
        ...data,
        isLog: data.type === "linear" ? false : true,
        yLimitManual: false,
        yMax: null,
        yMin: null,
      },
    };
  },
};
export function setAxisYLimitMin(state: ChartState, action: PayloadAction<{ id: string; yMin: number }>): void {
  const { id, yMin } = action.payload;
  state.dataAxis.forEach((e) => {
    if (e.id === id) {
      e.yMin = yMin;
    }
  });
}
export function setAxisYLimitMax(state: ChartState, action: PayloadAction<{ id: string; yMax: number }>): void {
  const { id, yMax } = action.payload;
  state.dataAxis.forEach((e) => {
    if (e.id === id) {
      e.yMax = yMax;
    }
  });
}
export function setAxisYLimitManual(
  state: ChartState,
  action: PayloadAction<{ id: string; yLimitManual: boolean; yMin: string; yMax: string }>
): void {
  const { id, yLimitManual, yMin, yMax } = action.payload;
  state.dataAxis.forEach((e) => {
    if (e.id === id) {
      e.yLimitManual = yLimitManual;
      e.yMin = yMin;
      e.yMax = yMax;
    }
  });
}
export function setAxisTypeLog(state: ChartState, action: PayloadAction<{ id: string; isLog: boolean }>): void {
  const { id, isLog } = action.payload;
  state.dataAxis.forEach((e) => {
    if (e.id === id) {
      e.isLog = isLog;
      e.type = isLog ? "logarithmic" : "linear";
    }
  });
}

export function addToDataset(state: ChartState, action: PayloadAction<DatasetInfo>): void {
  state.datasets.push(action.payload);
}

export function setDatasetVisible(state: ChartState, action: PayloadAction<{ index: number; visible: boolean }>): void {
  const { index, visible } = action.payload;
  state.datasets[index].visible = visible;
}
export function setDatasetOptimized(
  state: ChartState,
  action: PayloadAction<{ index: number; optimized: boolean }>
): void {
  const { index, optimized } = action.payload;
  state.datasets[index].pv.optimized = optimized;
}

export function setDatasetDiff(
  state: ChartState,
  action: PayloadAction<{ index: number; diffted: boolean }>
): void {
  const { index, diffted } = action.payload;
  state.datasets[index].pv.diff = diffted;
}

export function removeDataset(state: ChartState, action: PayloadAction<{ idx: number; removeAxis: any }>): void {
  const { idx, removeAxis } = action.payload;
  state.datasets.splice(idx, 1);

  if (removeAxis !== null) {
    // Remove data axis if needed
    let index = null;
    state.dataAxis.forEach((e, idx) => {
      if (e.id === removeAxis) {
        index = idx;
      }
    });
    if (index !== null) {
      state.dataAxis.splice(index, 1);
    }
  }
}
export function setWindowTime(state: ChartState, action: PayloadAction<number>): void {
  state.windowTime = action.payload;
}
export function setAutoScroll(state: ChartState, action: PayloadAction<boolean>): void {
  state.autoScroll = action.payload;
}

export function setZooming(state: ChartState, action: PayloadAction<boolean>): void {
  state.zooming = action.payload;
}
export function setSingleTooltip(state: ChartState, action: PayloadAction<boolean>): void {
  state.singleTooltip = action.payload;
}
export function setTimeReferenceEnd(state: ChartState, action: PayloadAction<boolean>): void {
  state.timeReferenceEnd = action.payload;
}
export const setTimeStart = {
  reducer(state: ChartState, action: PayloadAction<string>): void {
    state.timeStart = action.payload;
  },
  prepare(data: Date) {
    return {
      payload: data.toLocaleString(),
    };
  }
};
export const setTimeEnd = {
  reducer(state: ChartState, action: PayloadAction<string>): void {
    state.timeEnd = action.payload;
  },
  prepare(data: Date) {
    return {
      payload: data.toLocaleString(),
    };
  }
};
export const setSelectedTime = {
  reducer(state: ChartState, action: PayloadAction<string>): void {
    state.selectedTime = action.payload;
  },
  prepare(data: Date) {
    return {
      payload: data.toString()
    };
  }
};
