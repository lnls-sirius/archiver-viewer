/** ***** Fetching data functions *******/
/**
* The following functions communicate with the /retrieval appliance and
* fetch data from the archiver.
**/

import simplify from "simplify-js";

module.exports = (function () {
    const getUrl = ()=> {
        let host = "10.0.38.42";
        if (window.location.host === "vpn.cnpem.br") { // If using WEB VPN
            // Capture IPv4 address
            const ipRegExp = /(?<=https?\/)((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))(?=\/)/;
            const match = ipRegExp.exec(window.location.href);
            if (match && match.length > 1) {
                host = match[1];
            }
        } else {
            host = window.location.host;
        }

        if (host === "10.0.38.50") {
            host = "10.0.38.42";
            console.log("DEBUG SERVER. Setting host to 10.0.38.42");
        }
        return host;
    };

    let url = getUrl();
    const BYPASS_URL = window.location.protocol + "//" + url + "/archiver-generic-backend";
    const GET_DATA_URL = window.location.protocol + "//" + url + "/retrieval/data/getData.json";
    const APPLIANCES = [
        window.location.protocol + "//" + url,
        "http://archiver.cnpem.br",
        "http://10.0.38.42"
    ]

    /**
    * Parses the data retrieved from the archiver in a way that it can be understood by the chart controller
    **/
    const parseData = function (data, optimize = false, tolerance = 0.001, highRes = false) {
        const parsedData = [];
        for (let i = 0; i < data.length; i++) {
            const timedate = new Date(data[i].secs * 1e3 + data[i].nanos * 1e-6);
            if (!isNaN(timedate.getTime())) {
                parsedData.push(
                    (optimize ? {
                        timedate: timedate,
                        x: i,
                        y: data[i].val.length > 0 ? data[i].val[0] : data[i].val
                    }:{
                        x: timedate,
                        y: data[i].val.length > 0 ? data[i].val[0] : data[i].val
                    })
                );
            }
        }

        if (optimize) {
            const result = simplify(parsedData, tolerance, highRes);
            for (let i=0; i < result.length; i++) {
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
    async function fetchMetadata(pv, handleError) {
        if (pv === undefined) {
            return null;
        }

        let returnData = null;
        let errorCount = 0;
        let errors = [];
        for (const appliance of APPLIANCES) {
            if(returnData != null) {
                break;
            }
            const jsonurl = appliance + "/retrieval/bpl/getMetadata?pv=" + pv;
            const components = jsonurl.split("?");
            const HTTPMethod = jsonurl.length > 2048 ? "POST" : "GET";
            let lastErrors = {jqXHR:null, textStatus:null, errorThrown:null};

            console.log("Search appliance", appliance, "for PV", pv);
            try {
                await $.ajax({
                    url: components[0],
                    data: components[1],
                    type: HTTPMethod,
                    crossDomain: true,
                    dataType: "json",
                    timeout: 0,
                }).fail((jqXHR, textStatus, errorThrown) => {
                    errorCount ++;
                    lastErrors.jqXHR = jqXHR;
                    lastErrors.textStatus = textStatus;
                    lastErrors.errorThrown = errorThrown;
                    errors.push(lastErrors);
                }).done((data, textStatus, jqXHR) => {
                    returnData = jqXHR.status === 200 ? data : null;
                });
            } catch (error) {
                errorCount ++;
            }
        }
        if(errorCount == APPLIANCES.length){
            if (handleError && errors.length > 0) {
                handleError(errors[0].jqXHR, errors[0].textStatus, errors[0].errorThrown);
            } else {
                console.log("Failed to fetch metadadata for pv", pv, "last errors", errors);
            }
        }
        return returnData;
    }

    /**
    * Requests data from the archiver.
    **/
    async function fetchData(pv, from, to, isOptimized, bins, handleError, showLoading) {
        if (from === undefined || to === undefined) {
            return null;
        }

        const jsonurl = !isOptimized ?
        GET_DATA_URL + "?pv=" + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON():
        GET_DATA_URL + "?pv=optimized_" + bins + "(" + pv + ")&from=" + from.toJSON() + "&to=" + to.toJSON();


        const components = jsonurl.split("?");
        const HTTPMethod = jsonurl.length > 2048 ? "POST" : "GET";
        let returnData = null;

        await $.ajax({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            crossDomain: true,
            dataType: "text",
            beforeSend: showLoading,
            timeout: 0,
        }).done(function(data, textStatus, jqXHR) {
                returnData = textStatus === "success" ? data : null;
                if (returnData) {
                    try {
                        returnData = returnData.replace(/(-?Infinity)/g, "\"$1\"");
                        returnData = returnData.replace(/(NaN)/g, "\"$1\"");
                        returnData = JSON.parse(returnData);
                    } catch (err) {
                        console.log("Failed to parse data from request", components[0], err.message);
                    }
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                handleError(jqXHR, textStatus, errorThrown);
            });

        return returnData;
    }

    /**
    * Key event handler which looks for PVs in the archiver
    **/
    var query = function (pvs, handleSuccess, handleError, handleComplete, handleBefore) {

        var jsonurl = "http://" + url + '/retrieval/bpl/getMatchingPVs?pv=' + pvs + "&limit=4000",
            components = jsonurl.split('?'),
            querystring = components.length > 1 ? querystring = components[1] : '',
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET';

        $.ajax({
            url: components[0],
            data: querystring,
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'json',
            timeout: 3000,
            beforeSend:handleBefore,
            success: handleSuccess,
            error: handleError,
            complete: handleComplete
        });
    }

    return {
        url: function () {
            return url;
        },
        updateURL: function (u) {
            url = u;
        },
        bypassUrl: function() {
            return BYPASS_URL;
        },

        parseData: parseData,
        fetchMetadata: fetchMetadata,
        fetchData: fetchData,
        query: query,
    };

})();
