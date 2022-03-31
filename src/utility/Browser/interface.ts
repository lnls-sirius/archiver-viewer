export interface SettingsPVs {
  label: string;
  bins: number;
  optimized: boolean;
  diff: boolean;
}
export interface Settings {
  start: Date;
  end: Date;
  pvs: SettingsPVs[];
}

export interface ConfigPV {
  pvname: string;
  optimize: boolean;
  diff: boolean;
  bins: number;
}

export interface ConfigParameters {
  pvs: ConfigPV[];
  to?: Date;
  from?: Date;
}


export interface BrowserInterface {
  updateAddress(settings: Settings): void;
  setCookie(cname: string, cvalue: string, exdays: number): void;
  getCookie(cname: string): string;
  getConfigFromUrl(): ConfigParameters;
}
