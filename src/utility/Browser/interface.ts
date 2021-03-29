export interface SettingsPVs {
  label: string;
  bins: number;
  optimized: boolean;
}
export interface Settings {
  start: Date;
  end: Date;
  pvs: SettingsPVs[];
}
export interface BrowserInterface {
  updateAddress(settings: Settings): void;
  setCookie(cname: string, cvalue: string, exdays: number): void;
  getCookie(cname: string): string;
  getConfigFromUrl(): { pvs: string[]; from: Date; to: Date };
}
