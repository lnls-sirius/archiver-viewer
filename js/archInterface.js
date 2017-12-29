/******* Fetching data functions *******/
/**
* The following functions communicate with the /retrieval appliance and
* fetch data from the archiver.
**/

var example_data = [ 
{ "meta": { "name": "CONT:EVK-M8F:NTP:Offset" , "EGU": "millise" , "PREC": "3" },
"data": [ 
{ "secs": 1513548024, "val": 0.0010000000474974513, "nanos": 748794172, "severity":0, "status":0 },
{ "secs": 1513548032, "val": 0.0, "nanos": 748885714, "severity":0, "status":0 },
{ "secs": 1513548048, "val": 0.0010000000474974513, "nanos": 748814244, "severity":0, "status":0 },
{ "secs": 1513548056, "val": -0.0010000000474974513, "nanos": 748757111, "severity":0, "status":0 },
{ "secs": 1513548064, "val": 0.0, "nanos": 748782407, "severity":0, "status":0 },
{ "secs": 1513548072, "val": 0.0010000000474974513, "nanos": 748817790, "severity":0, "status":0 },
{ "secs": 1513548081, "val": -0.0010000000474974513, "nanos": 748699244, "severity":0, "status":0 },
{ "secs": 1513548089, "val": 0.0, "nanos": 748818415, "severity":0, "status":0 },
{ "secs": 1513548097, "val": 0.0010000000474974513, "nanos": 748817742, "severity":0, "status":0 },
{ "secs": 1513548113, "val": -0.0010000000474974513, "nanos": 748828042, "severity":0, "status":0 },
{ "secs": 1513548121, "val": 0.0, "nanos": 748709644, "severity":0, "status":0 },
{ "secs": 1513548129, "val": 0.0010000000474974513, "nanos": 748814173, "severity":0, "status":0 },
{ "secs": 1513548137, "val": -0.0010000000474974513, "nanos": 748818401, "severity":0, "status":0 },
{ "secs": 1513548145, "val": 0.0, "nanos": 748833409, "severity":0, "status":0 },
{ "secs": 1513548153, "val": 0.0010000000474974513, "nanos": 748815478, "severity":0, "status":0 },
{ "secs": 1513548161, "val": -0.0010000000474974513, "nanos": 748689783, "severity":0, "status":0 },
{ "secs": 1513548169, "val": 0.0, "nanos": 748836855, "severity":0, "status":0 },
{ "secs": 1513548177, "val": 0.0010000000474974513, "nanos": 748825636, "severity":0, "status":0 },
{ "secs": 1513548185, "val": -0.0010000000474974513, "nanos": 748823143, "severity":0, "status":0 },
{ "secs": 1513548193, "val": 0.0, "nanos": 748830676, "severity":0, "status":0 },
{ "secs": 1513548209, "val": 0.0010000000474974513, "nanos": 748810731, "severity":0, "status":0 },
{ "secs": 1513548217, "val": 0.0, "nanos": 748860025, "severity":0, "status":0 },
{ "secs": 1513548225, "val": 0.0010000000474974513, "nanos": 748832528, "severity":0, "status":0 },
{ "secs": 1513548241, "val": 0.0, "nanos": 748709676, "severity":0, "status":0 },
{ "secs": 1513548257, "val": 0.0010000000474974513, "nanos": 748817322, "severity":0, "status":0 },
{ "secs": 1513548265, "val": 0.0, "nanos": 748826082, "severity":0, "status":0 },
{ "secs": 1513548305, "val": 0.0010000000474974513, "nanos": 748811341, "severity":0, "status":0 },
{ "secs": 1513548321, "val": 0.0, "nanos": 748703767, "severity":0, "status":0 },
{ "secs": 1513548337, "val": 0.0010000000474974513, "nanos": 748862399, "severity":0, "status":0 },
{ "secs": 1513548345, "val": -0.0010000000474974513, "nanos": 748848862, "severity":0, "status":0 },
{ "secs": 1513548361, "val": 0.0010000000474974513, "nanos": 748696287, "severity":0, "status":0 },
{ "secs": 1513548369, "val": -0.0010000000474974513, "nanos": 748818982, "severity":0, "status":0 },
{ "secs": 1513548377, "val": 0.0, "nanos": 748826637, "severity":0, "status":0 },
{ "secs": 1513548385, "val": 0.0010000000474974513, "nanos": 748836799, "severity":0, "status":0 },
{ "secs": 1513548393, "val": 0.0, "nanos": 748814171, "severity":0, "status":0 },
{ "secs": 1513548401, "val": -0.0010000000474974513, "nanos": 748710943, "severity":0, "status":0 },
{ "secs": 1513548409, "val": 0.0, "nanos": 748844348, "severity":0, "status":0 },
{ "secs": 1513548417, "val": 0.0010000000474974513, "nanos": 748820451, "severity":0, "status":0 },
{ "secs": 1513548425, "val": 0.0, "nanos": 748821739, "severity":0, "status":0 },
{ "secs": 1513548433, "val": 0.0010000000474974513, "nanos": 748835264, "severity":0, "status":0 },
{ "secs": 1513548449, "val": -0.0010000000474974513, "nanos": 748813649, "severity":0, "status":0 },
{ "secs": 1513548457, "val": 0.0, "nanos": 748836654, "severity":0, "status":0 },
{ "secs": 1513548465, "val": 0.0010000000474974513, "nanos": 748833015, "severity":0, "status":0 },
{ "secs": 1513548473, "val": -0.0010000000474974513, "nanos": 748826987, "severity":0, "status":0 },
{ "secs": 1513548481, "val": 0.0, "nanos": 748726144, "severity":0, "status":0 },
{ "secs": 1513548497, "val": -0.0010000000474974513, "nanos": 748843843, "severity":0, "status":0 },
{ "secs": 1513548505, "val": 0.0, "nanos": 748837008, "severity":0, "status":0 },
{ "secs": 1513548521, "val": 0.0010000000474974513, "nanos": 748687203, "severity":0, "status":0 },
{ "secs": 1513548529, "val": 0.0, "nanos": 748802547, "severity":0, "status":0 },
{ "secs": 1513548545, "val": 0.0010000000474974513, "nanos": 748837882, "severity":0, "status":0 },
{ "secs": 1513548553, "val": 0.0, "nanos": 748822378, "severity":0, "status":0 },
{ "secs": 1513548577, "val": -0.0010000000474974513, "nanos": 748826373, "severity":0, "status":0 },
{ "secs": 1513548593, "val": 0.0, "nanos": 748826501, "severity":0, "status":0 },
{ "secs": 1513548601, "val": -0.0010000000474974513, "nanos": 748695586, "severity":0, "status":0 },
{ "secs": 1513548609, "val": 0.0, "nanos": 748879751, "severity":0, "status":0 },
{ "secs": 1513548625, "val": 0.0010000000474974513, "nanos": 748827371, "severity":0, "status":0 }] }
 ];

var example_metadata =  {"hostName":"10.0.4.57","paused":"false","HIGH":"1.0","creationTime":"2017-07-10T11:28:46.077Z","lowerAlarmLimit":"-10.0","PREC":"3.0","precision":"3.0","lowerCtrlLimit":"0.0","units":"millise","computedBytesPerEvent":"19","computedEventRate":"0.13333334","DESC":"Offset of source relative to the host","usePVAccess":"false","computedStorageRate":"2.55","modificationTime":"2017-07-10T11:28:46.077Z","upperDisplayLimit":"0.0","upperWarningLimit":"1.0","NELM":"1","DBRType":"DBR_SCALAR_DOUBLE","dataStores":["pb:\/\/localhost?name=STS&rootFolder=${ARCHAPPL_SHORT_TERM_FOLDER}&partitionGranularity=PARTITION_HOUR&consolidateOnShutdown=true","pb:\/\/localhost?name=MTS&rootFolder=${ARCHAPPL_MEDIUM_TERM_FOLDER}&partitionGranularity=PARTITION_DAY&hold=2&gather=1","pb:\/\/localhost?name=LTS&rootFolder=${ARCHAPPL_LONG_TERM_FOLDER}&partitionGranularity=PARTITION_YEAR"],"DRVH":"0.0","upperAlarmLimit":"10.0","userSpecifiedEventRate":"0.0","HIHI":"10.0","DRVL":"0.0","policyName":"Default","LOLO":"-10.0","LOPR":"0.0","HOPR":"0.0","useDBEProperties":"false","hasReducedDataSet":"false","lowerWarningLimit":"-1.0","chunkKey":"CONT\/EVK\/M8F\/NTP\/Offset:","applianceIdentity":"lnls_control_appliance_1","scalar":"true","EGU":"millise","pvName":"CONT:EVK-M8F:NTP:Offset","upperCtrlLimit":"0.0","LOW":"-1.0","lowerDisplayLimit":"0.0","samplingPeriod":"1.0","elementCount":"1","samplingMethod":"MONITOR","archiveFields":["HIHI","HIGH","LOW","LOLO","LOPR","HOPR"],"extraFields":{"ADEL":"0.0","MDEL":"0.0","SCAN":"1 second","NAME":"CONT:EVK-M8F:NTP:Offset","RTYP":"ai"}};

var example_query = [];

for (var i = 1; i <= 280; i++)
    example_query.push ("teste " + i);

var archInterface = (function () {

    const ARCHIVER_URL = "http://10.0.4.57:11998";

    /**
    * Parses the data retrieved from the archiver in a way that it can be understood by the chart controller
    **/
    var parseData = function (data, optimized) {

        var parsedData = [];

        if (optimized == undefined)
            optimized = false;

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

        //return example_metadata;

        if (pv == undefined)
            return null;

        var jsonurl = ARCHIVER_URL + '/retrieval/bpl/getMetadata?pv=' + pv,
            components = jsonurl.split('?'),
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            dataType: 'json',
            async: false,
            success: function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
            },
            error: function(xmlHttpRequest, textStatus, errorThrown) {
                alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
            }
        });

        return returnData;
    }

    /**
    * Requests data from the archiver.
    **/
    var fetchData = function (pv, from, to, isOptimized, bins) {

        //return example_data;

        if (from == undefined || to == undefined)
            return null;

        var jsonurl = ARCHIVER_URL + '/retrieval/data/getData.json?pv=' + pv + "&from=" + from.toJSON() + "&to=" + to.toJSON();

        if (isOptimized) {
            /*if (bins == undefined)
                bins = TIME_AXIS_PREFERENCES[global_settings.window_time].bins;
            */
            jsonurl = ARCHIVER_URL + '/retrieval/data/getData.json?pv=optimized_' + bins + '(' + pv + ")&from=" + from.toJSON() + "&to=" + to.toJSON();
        }

        var components = jsonurl.split('?'),
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        $.ajax ({
            url: components[0],
            data: components[1],
            type: HTTPMethod,
            dataType: 'json',
            async: false,
            success: function(data, textStatus, jqXHR) {
                returnData = textStatus == "success" ? data : null;
            },
            error: function(xmlHttpRequest, textStatus, errorThrown) {
                alert("Connection failed with " + xmlHttpRequest + " -- " + textStatus + " -- " + errorThrown);
            }
        });

        return returnData;
    }


    /**
    * Key event handler which looks for PVs in the archiver
    **/
    var query = function (pvs) {  

        return example_query;

        var jsonurl = ARCHIVER_URL + '/retrieval/bpl/getMatchingPVs?pv=' + pvs + "&limit=4000",
            components = jsonurl.split('?'),
            querystring = components.length > 1 ? querystring = components[1] : '',
            HTTPMethod = jsonurl.length > 2048 ? 'POST' : 'GET',
            returnData = null;

        $.ajax({
            url: components[0],
            data: querystring,
            type: HTTPMethod,
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
        url: ARCHIVER_URL,
        parseData: parseData,
        fetchMetadata : fetchMetadata,
        fetchData: fetchData,
        query: query,
    }

}) ();
