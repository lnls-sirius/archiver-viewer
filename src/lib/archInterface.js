/** ***** Fetching data functions *******/
/**
 * The following functions communicate with the /retrieval appliance and
 * fetch data from the archiver.
 **/
import simplify from "simplify-js";
import axios from "axios";

const getUrl = () => {
  let host = "10.0.38.42";
  if (window.location.host === "vpn.cnpem.br") {
    // If using WEB VPN
    // Capture IPv4 address
    const ipRegExp = /https?\/((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))\//;
    const match = ipRegExp.exec(window.location.href);
    if (match && match.length > 1) {
      host = match[1];
    }
  } else {
    host = window.location.host;
  }

  if (host === "10.0.38.50" || window.location.host === "localhost:8080") {
    host = "10.0.38.42";
    console.log("DEBUG SERVER. Setting host to 10.0.38.42");
  }
  return host;
};

let url = getUrl();
const BYPASS_URL = window.location.protocol + "//" + url + "/archiver-generic-backend";
const GET_DATA_URL = window.location.protocol + "//" + url + "/retrieval/data/getData.json";
const APPLIANCES = [window.location.protocol + "//" + url, "http://archiver.cnpem.br"];

/**
 * Parses the data retrieved from the archiver in a way that it can be understood by the chart controller
 **/
const parseData = function (data, optimize = false, tolerance = 0.001, highRes = false) {
  const parsedData = [];
  for (let i = 0; i < data.length; i++) {
    const timedate = new Date(data[i].secs * 1e3 + data[i].nanos * 1e-6);
    if (!isNaN(timedate.getTime())) {
      parsedData.push(
        optimize
          ? {
              timedate: timedate,
              x: i,
              y: data[i].val.length > 0 ? data[i].val[0] : data[i].val,
            }
          : {
              x: timedate,
              y: data[i].val.length > 0 ? data[i].val[0] : data[i].val,
            }
      );
    }
  }
  if (optimize) {
    const result = simplify(parsedData, tolerance, highRes);
    for (let i = 0; i < result.length; i++) {
      result[i].x = result[i].timedate;
    }
    console.log(parsedData.length, result.length);
    return result;
  }
  return parsedData;
};

/**
 * Gets the metadata associated with a PV.
 **/
async function fetchMetadata(pv) {
  if (pv === undefined) {
    return null;
  }

  let errorCount = 0;
  for (const appliance of APPLIANCES) {
    const jsonurl = appliance + "/retrieval/bpl/getMetadata?pv=" + pv;

    const data = await axios
      .get(jsonurl, { timeout: 0, responseType: "json" })
      .then((res) => {
        if (res.status !== 200) {
          return null;
        }
        return res.data;
      })
      .catch((e) => {
        errorCount++;
        return null;
      });
    if (data !== null) {
      return data;
    }
  }
  if (errorCount === APPLIANCES.length) {
    // @todo: Consider doing something
    // console.warn(`Failed to obtain metadata for PV ${pv}`);
  }
}

/**
 * Requests data from the archiver.
 **/
async function fetchData(pv, from, to, isOptimized, bins, handleError, showLoading) {
  if (from === undefined || to === undefined) {
    return null;
  }

  const jsonurl = !isOptimized
    ? GET_DATA_URL + "?pv=" + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON()
    : GET_DATA_URL + "?pv=optimized_" + bins + "(" + pv + ")&from=" + from.toJSON() + "&to=" + to.toJSON();

  return axios
    .get(jsonurl, {
      timeout: 0,
      method: "GET",
      responseType: "text",
      transformResponse: (res) => {
        let data = res.replace(/(-?Infinity)/g, '"$1"');
        data = data.replace(/(NaN)/g, '"$1"');
        data = JSON.parse(data);
        return data;
      },
    })
    .then((res) => {
      if (res.status !== 200) {
        // @todo: Handler this !
        console.warn(`Request ${jsonurl} return invalid status code ${res}`);
        return null;
      }
      return res.data;
    });
}

/**
 * Key event handler which looks for PVs in the archiver
 **/
const query = async (pvs) => {
  const timeout = 10000;
  const _url = `${window.location.protocol}//${url}/retrieval/bpl/getMatchingPVs?${new URLSearchParams({
    pv: pvs,
    limit: 500,
  }).toString()}`;

  return await axios.get(_url, { method: "GET", timeout: timeout, responseType: "json" }).then((res) => {
    if (res.status !== 200) {
      throw `Failed to complete request ${_url}, response ${res}`;
    }
    return res.data;
  });
};

export default {
  url: function () {
    return url;
  },
  updateURL: function (u) {
    url = u;
  },
  bypassUrl: function () {
    return BYPASS_URL;
  },

  parseData: parseData,
  fetchMetadata: fetchMetadata,
  fetchData: fetchData,
  query: query,
};
