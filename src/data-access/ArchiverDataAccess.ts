import axios from "axios";
import { DataAccess, ArchiverData, ArchiverDataPoint } from "./interface";

export const ipRegExp = /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
export const defaultHost = "10.0.38.46";

export class ArchiverDataAccess implements DataAccess {
  host: string;
  private url: string;
  private BYPASS_URL: string;
  private GET_DATA_URL: string;
  private APPLIANCES: string[];

  constructor() {
    this.host = defaultHost;
    this.url = this.getUrl();
    this.BYPASS_URL = `${window.location.protocol}//${this.url}/archiver-generic-backend`;
    this.GET_DATA_URL = `${window.location.protocol}//${this.url}/retrieval/data/getData.json`;

    this.APPLIANCES = [
      `${window.location.protocol}//${this.url}`,
      `${window.location.protocol}//${this.url}/archiver-beamlines`,
    ];
  }

  async getRemoteDate(): Promise<Date> {
    const dateString: string | null = await axios
      .get(`${this.BYPASS_URL}/date`, { timeout: 2000 })
      .then((res) => {
        if (res.status === 200) {
          return res.data;
        }
        throw `Invalid response from date backend ${res.status}, ${res.data}`;
      })
      .catch((e) => {
        console.warn(`Failed to get date from remote server ${e}`);
        return null;
      });

    if (dateString) {
      return new Date(dateString);
    }

    return null;
  }

  async fetchMetadata(pv: string): Promise<null | []> {
    if (pv === undefined) {
      return null;
    }

    for (const appliance of this.APPLIANCES) {
      const jsonurl = `${appliance}/retrieval/bpl/getMetadata?pv=${pv}`;
      const data = await axios
        .get(jsonurl, { timeout: 0, responseType: "json" })
        .then((res) => {
          if (res.status !== 200) {
            return null;
          }
          return res.data;
        })
        .catch((e) => {
          return null;
        });
      if (data !== null) {
        return data;
      }
    }
    return null;
  }

  setUrl(url: string): void {
    this.url = url;
  }

  async query(search: string): Promise<string[]> {
    const timeout = 10000;
    const _url = `${window.location.protocol}//${this.url}/retrieval/bpl/getMatchingPVs?${new URLSearchParams({
      pv: search,
      limit: "500",
    }).toString()}`;

    return await axios.get(_url, { method: "GET", timeout: timeout, responseType: "json" }).then((res) => {
      if (res.status !== 200) {
        throw `Failed to complete request ${_url}, response ${res}`;
      }
      return res.data;
    });
  }

  private parseData(data: any[]): ArchiverDataPoint[] {
    const outData: ArchiverDataPoint[] = [];
    data.forEach(({ val, secs, nanos, severity, status }) => {
      let y;
      if (val instanceof Array) {
        const [avg, std, min, max, nelm] = val;
        y = avg;
      } else {
        y = val;
      }

      const x = new Date(secs * 1e3 + nanos * 1e-6);
      if (!isNaN(x.getTime())) {
        outData.push({
          x,
          y,
          severity,
          status,
        });
      }
    });
    return outData;
  }

  async fetchData(pv: string, from: Date, to: Date, isOptimized?: boolean, bins?: number): Promise<ArchiverData> {
    if (from === undefined || to === undefined) {
      return null;
    }
    if (isOptimized === undefined) {
      isOptimized = false;
    }

    const jsonurl = !isOptimized
      ? `${this.GET_DATA_URL}?pv=${pv}&from=${from.toJSON()}&to=${to.toJSON()}`
      : `${this.GET_DATA_URL}?pv=optimized_${bins}(${pv})&from=${from.toJSON()}&to=${to.toJSON()}`;

    const res = await axios
      .get(jsonurl, {
        timeout: 0,
        method: "GET",
        responseType: "text",
        transformResponse: (res) => {
          if (res.includes("Bad Request")) {
            throw `Invalid response from ${jsonurl}`;
          }
          let data = res.replace(/(-?Infinity)/g, '"$1"');
          data = data.replace(/(NaN)/g, '"$1"');
          data = JSON.parse(data);
          return data;
        },
      })
      .then((res) => {
        if (res.status !== 200) {
          throw `Request ${jsonurl} return invalid status code ${res}`;
        }
        return res.data[0];
      });

    return {
      meta: res.meta,
      data: this.parseData(res.data),
    };
  }

  getUrl(): string {
    if (window.location.host === "vpn.cnpem.br") {
      // If using WEB VPN
      // Capture IPv4 address
      const match = ipRegExp.exec(window.location.href);
      if (match && match.length > 1) {
        this.host = match[1];
      }
    } else {
      this.host = window.location.host;
    }

    if (window.location.host === "localhost:8080" || window.location.host === "127.0.0.1:8080") {
      this.host = defaultHost;
      console.log(`DEBUG SERVER. Setting host to ${this.host}`);
    }
    return this.host;
  }
}
