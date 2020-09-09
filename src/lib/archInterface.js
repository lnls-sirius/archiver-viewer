/******* Fetching data functions *******/
/**
* The following functions communicate with the /retrieval appliance and
* fetch data from the archiver.
**/

import simplify from 'simplify-js';

module.exports = (function () {
    var getUrl = ()=> {
        var host = "10.0.38.42"; // Initialize with the proxy addr
        if (window.location.host == "vpn.cnpem.br") { // If using WEB VPN
                // Capture IPv4 addr
                var ipRegExp = /(?<=https?\/)((?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])))(?=\/)/;
                var match = ipRegExp.exec(window.location.href);
                if(match && match.length > 1){
                    host = match[1];
                }
        } else {
            host = window.location.host;
        }

	if(host == "10.0.38.50"){
	    host = "10.0.38.42";
	    console.log("DEBUG SERVER. Setting host to 10.0.38.42");
	}

        return  "https://" + host;
    }

    var url = getUrl();
    /**
    * Parses the data retrieved from the archiver in a way that it can be understood by the chart controller
    **/
    var parseData = function (data, optimize = false, tolerance = 0.001, highRes = false) {
        let parsedData = [];
        for (let i = 0; i < data.length; i++) {
            let timedate = new Date(data[i].secs * 1e3 + data[i].nanos * 1e-6);
            if (!isNaN(timedate.getTime())) {
                parsedData.push(
                    (optimize ? {
                        timedate : timedate,
                        x : i,
                        y : data[i].val.length > 0 ? data[i].val[0] : data[i].val
                    }:{
                        x : timedate,
                        y : data[i].val.length > 0 ? data[i].val[0] : data[i].val
                    })
                );
            }
        }

        if(optimize){
            let result = simplify(parsedData, tolerance, highRes);
            for(let i=0; i < result.length; i++){
                result[i].x = result[i].timedate;
            }
            console.log(parsedData.length, result.length);
            return result;
        }
        return parsedData;
    }

    /**
    * Gets the metadata associated with a PV.
    **/
    async function fetchMetadata (pv, handleError) {
        if (pv == undefined)
            return null;

        var jsonurl = url + '/retrieval/bpl/getMetadata?pv=' + pv,
            components = jsonurl.split('?'),
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        await $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'json',
            //async: false,
        })
	.done(function(data, textStatus, jqXHR) {
               returnData = textStatus == "success" ? data : null;
            })
        .fail(function (jqXHR, textStatus, errorThrown) { handleError(jqXHR, textStatus, errorThrown); });

	return returnData;
    }

    /**
    * Requests data from the archiver.
    **/
    async function fetchData (pv, from, to, isOptimized, bins, handleError, showLoading) {
	if (from == undefined || to == undefined)
            return null;

        var jsonurl = url + '/retrieval/data/getData.json?pv=' + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON();

        if (isOptimized) {
            /*if (bins == undefined)
                bins = TIME_AXIS_PREFERENCES[global_settings.window_time].bins;
            */
            jsonurl = url + '/retrieval/data/getData.json?pv=optimized_' + bins + '(' + pv + ")&from=" + from.toJSON() + "&to=" + to.toJSON();
        }

        var components = jsonurl.split('?'),
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        await $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'text',
	    beforeSend:showLoading,
            //async: false,
        })
	.done(function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
                if(returnData){
                    try{
                        returnData = returnData.replace(/(-?Infinity)/g, "\"$1\"");
                        returnData = returnData.replace(/(NaN)/g, "\"$1\"");
                        returnData = JSON.parse(returnData);
                    }catch(err){
                        console.log("Failed to parse data from request", components[0], err.message);
                    }
                }
            })
	.fail(function (jqXHR, textStatus, errorThrown) { handleError(jqXHR, textStatus, errorThrown); });

	return returnData;
    }

    async function getPVStatus(pvs, handleSuccess, handleError, handleComplete, handleBefore){
        var jsonurl = url + '/mgmt/bpl/getPVStatus?pv=' + pvs + "&limit=4000",
            components = jsonurl.split('?'),
            querystring = components.length > 1 ? querystring = components[1] : '',
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        await $.ajax({
            url: components[0],
            data: querystring,
            type: HTTPMethod,
            dataType: 'json',
            crossDomain: true,
            //async: false,
            timeout: 3000,
            beforeSend:handleBefore,
            success: handleSuccess,
            error: handleError,
            complete: handleComplete
        });

        return returnData;
    }
    /**
    * Key event handler which looks for PVs in the archiver
    **/
    var query = function (pvs) {

        var jsonurl = url + '/retrieval/bpl/getMatchingPVs?pv=' + pvs + "&limit=4000",
            components = jsonurl.split('?'),
            querystring = components.length > 1 ? querystring = components[1] : '',
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        $.ajax({
            url: components[0],
            data: querystring,
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'json',
            async: false,
            timeout: 3000,
            success: function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
            },
            error: function(xmlHttpRequest, textStatus, errorThrown) {
                console.log(xmlHttpRequest, textStatus, errorThrown);
            }
        });
        return returnData;
    }

    return {

        url: function () { return url; },
        updateURL: function (u) { url = u },

        parseData: parseData,
        fetchMetadata : fetchMetadata,
        fetchData: fetchData,
        query: query,
        getPVStatus: getPVStatus
	}

})();
