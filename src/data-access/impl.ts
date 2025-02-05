import axios from "axios";
import { DataAccess, ArchiverData, ArchiverMetadataPoint, ArchiverDataPoint, ArchiverMetadata } from "./interface";
import { DataAccessError, OptimizeDataError, InvalidParameterError } from "../utility/errors";
import control from "../entities/Chart";
import { promises } from "dns";

export const ipRegExp = /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
export const defaultHost = [
  "ais-eng-srv-ca.cnpem.br", "archiver-temp.cnpem.br"
];

export class ArchiverDataAccess implements DataAccess{

  private url: string[];
  private BYPASS_URL: string[];
  private GET_DATA_URL: string[];
  private APPLIANCES: string[][];

  constructor() {
    this.url = defaultHost;
    this.BYPASS_URL = [];
    this.GET_DATA_URL = [];
    this.APPLIANCES = [];

    this.url.map((url: string) => {
      this.BYPASS_URL.push(`${window.location.protocol}//${url}/archiver-generic-backend`);
      this.GET_DATA_URL.push(`${window.location.protocol}//${url}/retrieval/data/getData.json`);
      this.APPLIANCES.push([
        `${window.location.protocol}//${url}`,
        `${window.location.protocol}//${url}/archiver-beamlines`,
      ]);
    })
  }

  async getRemoteDate(): Promise<Date> {
    let remoteDate: Date;
    this.BYPASS_URL.map(async (bypass_url: string) => {
      try{
        const dateString: string | null = await axios.get(`${bypass_url}/date`, { timeout: 2000 }).then((res) => {
          if (res.status === 200) {
            return res.data;
          }
          throw new DataAccessError(`Invalid response from date backend ${res.status}, ${res.data}`);
        });
  
        if (dateString) {
          remoteDate = new Date(dateString);
        }
        throw new DataAccessError("Unable to transform date response into Date object");
      }catch(Exception){
        console.log("An exception was caught while getting the remote date from the Archiver!")
      }
    })
    return remoteDate;
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

    for (const appliance_urls of this.APPLIANCES) {
      for (const appliance of appliance_urls) {
        const jsonurl = `${appliance}/retrieval/bpl/getMetadata?pv=${pv}`;
        const data = await this.fetchMetadataFromAppliance(jsonurl);
        /* const data = */
        if (data !== null) {
          return data;
        }
      }
    }
    return null;
  }

  async query(search: string): Promise<string[]> {
    const timeout = 10000;
    return await Promise.all(
      this.url.map(async (url: string) => {
        const _url = `${window.location.protocol}//${url}/retrieval/bpl/getMatchingPVs?${new URLSearchParams({
          pv: search,
          limit: "500",
        }).toString()}`;
    
        return await axios.get(_url, { method: "GET", timeout: timeout, responseType: "json" }).then((res) => {
          if (res.status !== 200) {
            throw `Failed to complete request ${_url}, response ${res}`;
          }
          return res.data;
        });
      })
    ).then((result: string[][]): Promise<string[]> => {
      return Promise.resolve(result[0].concat(result[1]));
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
    if (from === undefined || to === undefined) {
      return null;
    }
    if (isOptimized === undefined) {
      isOptimized = false;
    }
    if (diff === undefined) {
      diff = false;
    }

    return await Promise.allSettled(
      this.GET_DATA_URL.map(async (get_data_url: string) => {
        const jsonurl = !isOptimized
          ? `${get_data_url}?pv=${pv}&from=${from.toJSON()}&to=${to.toJSON()}`
          : `${get_data_url}?pv=optimized_${bins}(${pv})&from=${from.toJSON()}&to=${to.toJSON()}`;

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
              return new DataAccessError(`Request ${jsonurl} return invalid status code ${res}`);
            }

            if (isOptimized && (res.data.length === 0 || (res.data[0].data.length === 0 && res.data.length > 1))) {
              return new OptimizeDataError(pv, bins, jsonurl);
            }

            if (res.data.length === 0) {
              return new DataAccessError(
                `Request returned an empty array, probably due to an invalid range for the url ${jsonurl}`
              );
            }
            return res.data[0];
          });

        let finalData: ArchiverDataPoint[] = this.parseData(res.data);

        if(diff == true){
          finalData = await this.differentiateData(pv, finalData);
        }
        return {
          meta: res.meta,
          data: finalData
        };
      })
    ).then((responseList: any[]): Promise<ArchiverData> => {
      const emptyResult: ArchiverData = {meta: [], data: []};
      const result: ArchiverData[] = responseList.map((response: any) => {
        if(response.status == "fulfilled"){
          return response.value
        }
        return emptyResult
      })
      const errorApi0 = result[0] instanceof DataAccessError;
      const errorApi1 = result[1] instanceof DataAccessError;
      if(errorApi0 === true && errorApi1 === true){
        throw result[0];
      }else if(errorApi0 === true){
        result[0] = emptyResult;
      }else if(errorApi1 === true){
        result[1] = emptyResult;
      }

      let finalData: ArchiverDataPoint[] = result[0].data;
      let finalMeta: ArchiverMetadataPoint[] = result[0].meta;
      if(result[0].data.length <= 1 && result[1].data.length > 1){
        finalData = result[1].data;
        finalMeta = result[1].meta;
      }else if(result[1].data.length > 1){
        const filterDate = finalData[0].x.getTime()
        const ibiraData = result[1].data.reduce((pastValue, currentValue) => {
          if(currentValue.x.getTime() < filterDate){
            pastValue.push(currentValue);
          }
          return pastValue;
        }, []);
        finalData = ibiraData.concat(finalData);
      }
      return Promise.resolve({
        meta: finalMeta,
        data: finalData
      });
    });
  }

}
