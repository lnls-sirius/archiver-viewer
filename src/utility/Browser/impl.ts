import { BrowserInterface } from "./interface";

export class Browser implements BrowserInterface {
  isValidDate(d: Date): boolean {
    if (!(d instanceof Date)) {
      return false;
    }
    if (isNaN(d.valueOf())) {
      return false;
    }
    return true;
  }

  getConfigFromUrl(): { pvs: string[]; from: Date; to: Date } {
    const searchPath = window.location.search;
    const pvs: string[] = [];
    let fromString = null;
    let toString = null;

    const searchPaths = searchPath.split("&");

    for (let i = 0; i < searchPaths.length; i++) {
      if (searchPaths[i].indexOf("pv=") !== -1) {
        pvs.push(decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1)));
      } else if (searchPaths[i].indexOf("from=") !== -1) {
        fromString = decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1));
      } else if (searchPaths[i].indexOf("to=") !== -1) {
        toString = decodeURIComponent(searchPaths[i].substr(searchPaths[i].indexOf("=") + 1));
      }
    }
    let from: Date = null;
    let to: Date = null;

    if (fromString) {
      from = new Date(fromString);
    }

    if (toString) {
      to = new Date(toString);
    }

    if (!this.isValidDate(from)) {
      from = null;
    }
    if (!this.isValidDate(to)) {
      to = null;
    }
    return {
      to,
      from,
      pvs,
    };
  }

  private pushAddress(searchString: string): void {
    const newurl = `${window.location.pathname}${searchString}`;
    if (history.pushState) {
      window.history.pushState({ path: newurl }, "", newurl);
    }
  }

  updateAddress(datasets: any[], bins: number, start: Date, end: Date): void {
    let searchString = "?";
    datasets.forEach((dataset) => {
      const label = dataset.label;
      const optimized = dataset.pv.optimized;

      if (optimized) {
        searchString += `pv=optimized_${bins}(${encodeURIComponent(label)})&`;
      } else {
        searchString += `pv=${encodeURIComponent(label)}&`;
      }
    });

    searchString += `from=${encodeURIComponent(start.toJSON())}&`;
    searchString += `to=${encodeURIComponent(end.toJSON())}`;
    this.pushAddress(searchString);
  }

  setCookie(cname: string, cvalue: string, exdays: number): void {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${cname}=${cvalue}; ${expires}; SameSite=Strict`;
  }

  getCookie(cname: string): string {
    const name = cname + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
}
