import axios from "axios";
import { DataAccess, ArchiverData, ArchiverDataPoint, ArchiverMetadata } from "./interface";
import { DataAccessError, OptimizeDataError, InvalidParameterError } from "../utility/errors";
import control from "../entities/Chart";

export const ipRegExp = /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
export const defaultHost = "10.0.38.46";

export class ArchiverDataAccess implements DataAccess{

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
    const dateString: string | null = await axios.get(`${this.BYPASS_URL}/date`, { timeout: 2000 }).then((res) => {
      if (res.status === 200) {
        return res.data;
      }
      throw new DataAccessError(`Invalid response from date backend ${res.status}, ${res.data}`);
    });
    if (dateString) {
      return new Date(dateString);
    }

    throw new DataAccessError("Unable to transform date response into Date object");
  }

  private async fetchMetadataFromAppliance(jsonurl: string): Promise<null | ArchiverMetadata> {
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

    if (data === null) {
      return null;
    }
    const metadata: ArchiverMetadata = {
      pvName: data.pvName,
      DBRType: data.DBRType,
      NELM: parseFloat(data.NELM),
      PREC: parseFloat(data.PREC),
      EGU: data.EGU,
      scalar: data.scalar === "true",
      applianceIdentity: data.applianceIdentity,
      computedEventRate: parseFloat(data.computedEventRate),
      hostName: data.hostname,
      paused: data.paused === "true",
      samplingMethod: data.samplingMethod,
      samplingPeriod: parseFloat(data.samplingPeriod),
    };
    return metadata;
  }

  async fetchMetadata(pv: string): Promise<null | ArchiverMetadata> {
    if (pv === undefined) {
      throw new InvalidParameterError("PV name is undefined");
    }

    for (const appliance of this.APPLIANCES) {
      const jsonurl = `${appliance}/retrieval/bpl/getMetadata?pv=${pv}`;
      const data = await this.fetchMetadataFromAppliance(jsonurl);
      /* const data = */
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
          status
        });
      }
    });
    return outData;
  }

  private async getDataInArchiver(selectedDate: Date, pv: string){
    const interval = 100;
    const startInt = new Date(control.getRefDiff().getTime() - interval);
    const endInt = new Date(control.getRefDiff().getTime() + interval);

    let archiverInterval = await this.fetchData(pv, startInt, endInt);

    let valueComp = this.getDataInArray(selectedDate, archiverInterval.data);

    return valueComp;
  }

  private getDataInArray(selectedDate: Date, dataArray: ArchiverDataPoint[]): number{
    let valueComp = 0;
    let closestDate = selectedDate.getTime();

    dataArray.map((point) =>{
      let dateDiff = (selectedDate.getTime() - point.x.getTime());
      if(dateDiff < 0){
        dateDiff *= -1;
      }
      if(closestDate > dateDiff){
        closestDate = dateDiff;
        valueComp = point.y;
      }
    });
    return valueComp;
  }

  private async getClosestDate(pv: string, dataArray: ArchiverDataPoint[]): Promise<number>{

    let selectedDate = new Date();
    let valueComp = 0;

    if (control.getRefDiff() !== undefined){
      selectedDate = new Date(control.getRefDiff());
    }

    if (selectedDate >= control.getStart() &&
      selectedDate <= control.getEnd()){
        valueComp = this.getDataInArray(selectedDate, dataArray);
    }else{
      valueComp = await this.getDataInArchiver(selectedDate, pv);
    }

    return valueComp;
  }

  private async differentiateData(pv: string, diffData: ArchiverDataPoint[]): Promise<ArchiverDataPoint[]>{

    let valueComp = await this.getClosestDate(pv, diffData);

    diffData.map((point) =>{
      point.y = point.y - valueComp;
    });

    return diffData;
  }

  async fetchData(pv: string, from: Date, to: Date, ref?: Date, isOptimized?: boolean, diff?: boolean, bins?: number): Promise<ArchiverData> {

    let finalData = null;

    if (from === undefined || to === undefined) {
      return null;
    }
    if (isOptimized === undefined) {
      isOptimized = false;
    }
    if (diff === undefined) {
      diff = false;
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
          throw new DataAccessError(`Request ${jsonurl} return invalid status code ${res}`);
        }

        if (isOptimized && (res.data.length === 0 || res.data[0].data.length === 0)) {
          throw new OptimizeDataError(pv, bins, jsonurl);
        }

        if (res.data.length === 0) {
          throw new DataAccessError(
            `Request returned an empty array, probably due to an invalid range for the url ${jsonurl}`
          );
        }
        return res.data[0];
      });

    finalData = this.parseData(res.data);

    if(diff == true){
      finalData = await this.differentiateData(pv, finalData);
    }

    return {
      meta: res.meta,
      data: finalData
    };
  }

  getUrl(): string {
    this.host = "ais-eng-srv-ta.cnpem.br";
    return this.host;
  }
}
