export interface BrowserInterface {
  updateAddress(datasets: any[], bins: number, start: Date, end: Date): void;
  setCookie(cname: string, cvalue: string, exdays: number): void;
  getCookie(cname: string): string;
  getConfigFromUrl(): { pvs: string[]; from: Date; to: Date };
}
