/******* Fetching data functions *******/
/**
* The following functions communicate with the /retrieval appliance and
* fetch data from the archiver.
**/

import * as ui from './ui';

module.exports = (function () {

    var url = "https://10.0.38.42";

    /**
    * Parses the data retrieved from the archiver in a way that it can be understood by the chart controller
    **/
    var parseData = function (data) {

        var parsedData = [];

        for (var i = 0; i < data.length; i++) {

            var timedate = new Date(data[i].secs * 1e3 + data[i].nanos * 1e-6);

            if (!isNaN(timedate.getTime())) {

                parsedData.push({
                    x : timedate,
                    y : data[i].val.length > 0 ? data[i].val[0] : data[i].val
                });
            }
        }
        return parsedData;
    }

    /**
    * Gets the metadata associated with a PV.
    **/
    var fetchMetadata = function (pv) {

        if (pv == undefined)
            return null;

        var jsonurl = url + '/retrieval/bpl/getMetadata?pv=' + pv,
            components = jsonurl.split('?'),
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'json',
            async: false,
            success: function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
            },
            error: function(xmlHttpRequest, textStatus, errorThrown) {
                ui.toogleSearchWarning ("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
            }
        });

        return returnData;
    }

    /**
    * Requests data from the archiver.
    **/
    var fetchData = function (pv, from, to, isOptimized, bins) {

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

        $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            crossDomain: true,
            dataType: 'text',
            async: false,
            success: function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
                if(returnData){
                    try{
                        returnData = returnData.replace(/(-?Infinity)/g, "\"$1\"");
                        returnData = returnData.replace(/(NaN)/g, "\"$1\"");
                        returnData = JSON.parse(returnData);
                    }catch(err){
                        ui.toogleSearchWarning ("Failed to parse data from request " + components[0] + ". " + err.message);
                        console.log(components[0], err.message);
                    }
                }
            },
            error: function(xmlHttpRequest, textStatus, errorThrown) {
                ui.toogleSearchWarning ("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
                console.log(components[0], textStatus, errorThrown);
            }
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
                ui.toogleSearchWarning ("An error occured on the server while disconnected PVs -- " + textStatus + " -- " + errorThrown);
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
    }

})();
