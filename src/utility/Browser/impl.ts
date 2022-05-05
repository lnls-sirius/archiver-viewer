import { BrowserInterface, ConfigParameters, ConfigPV, Settings } from "./interface";

export class Browser implements BrowserInterface {
  getConfigFromUrl(): ConfigParameters {
    const searchPath = window.location.search;

    const input: ConfigParameters = { pvs: [], from: null, to: null, ref: null };

    const decodeParameter = (str: string) => {
      const [k, v] = str.split("=", 2);
      return [k.replace("?", ""), v];
    };

    const parsePV = (str: string): ConfigPV => {
      let optimize = false;
      let diff = false;
      let bins = -1;
      let pvname = str;

      if (str.indexOf("optimized_") !== -1) {
        bins = parseFloat(str.substr("optimized_".length, str.indexOf("(") + 1));
        pvname = str.slice(str.indexOf("(") + 1, str.indexOf(")"));
        optimize = true;
      }else if(str.indexOf("_diff") !== -1){
        pvname = pvname.slice(0, pvname.indexOf("_diff"));
        diff = true;
      }

      if (str.indexOf("_diff") !== -1 && diff !== true) {
        diff = true;
      }

      return { optimize, diff, bins, pvname };
    };

    const createDateFromString = (str: string): Date => {
      console.debug(`Parsing string '${str}' into date`);
      const date = new Date(str);
      if (isNaN(date.valueOf())) {
        return null;
      }
      return date;
    };

    for (const str of decodeURIComponent(searchPath).split("&")) {
      const [k, v] = decodeParameter(str);
      switch (k) {
        case "pv":
          input.pvs.push(parsePV(v));
          break;
        case "from":
          input.from = createDateFromString(v);
          break;
        case "to":
          input.to = createDateFromString(v);
          break;
        case "ref":
          input.ref = createDateFromString(v);
          break;
        default:
          console.warn(`Received invalid argument '${k}' value '${v}'`);
          continue;
      }
      console.debug(`Parsing url parameter '${k}' value ${v}`);
    }
    console.info(`Parsed url parameters`, input);

    if (input.ref == null || input.ref == undefined){
      input.ref = new Date();
      if (input.from > input.ref){
        input.ref = input.from;
      }
      if(input.to < input.ref){
        input.ref = input.to;
      }

    }

    return input;
  }

  private pushAddress(searchString: string): void {
    const newurl = `${window.location.pathname}${searchString}`;
    if (history.pushState) {
      window.history.pushState({ path: newurl }, "", newurl);
    }
  }

  updateAddress({ end, start, ref, pvs }: Settings): void {
    let searchString = "?";
    pvs.forEach(({ bins, label, optimized, diff }) => {

      let stringPV = ""

      if (optimized) {
        stringPV += `optimized_${bins}(${encodeURIComponent(label)})`;
      } else {
        stringPV += `${encodeURIComponent(label)}`;
      }

      if (diff) {
        searchString += `pv=${stringPV}_diff&`;
      } else {
        searchString += `pv=${stringPV}&`;
      }

    });

    searchString += `from=${encodeURIComponent(start.toJSON())}&`;
    searchString += `to=${encodeURIComponent(end.toJSON())}&`;
    searchString += `ref=${encodeURIComponent(ref.toJSON())}`;
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
