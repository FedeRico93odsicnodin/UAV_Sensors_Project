// getting all session storage filters 
function getSessionStorageFilters() {
    var sessionStorageFiltersStr = sessionStorage.getItem("filterOptions");
    if(typeof(sessionStorageFiltersStr != 'undefined')) {
        var allFilters = JSON.parse(sessionStorageFiltersStr)
        return allFilters
    }
    return null
}
// get gases to display from session storage filters 
function getGasesToDisplay() {
    var allFilters = getSessionStorageFilters()
    var gasesToRetrieve = []
    for(var currFilter in allFilters) {
        if(allFilters[currFilter].filter_context != "Gases")
            continue
        if(allFilters[currFilter].selected == 0) 
            continue
        gasesToRetrieve.push({"gasId": parseInt(allFilters[currFilter].filter_value), "gasName": allFilters[currFilter].filter_name})
    }
    return gasesToRetrieve
}
// allow to validate the possible inputs for the current inserted filters 
function validateInputFilterData() {
    for(var sensObj in OverallSensors) {
        var currAdjustIdSel = OverallSensors[sensObj]['adjustId'];
        var currAdjustmentInput = document.getElementById(currAdjustIdSel).value;
        if(currAdjustmentInput == '') {
            continue;
        }
        if(isNaN(currAdjustmentInput)) {
            alert('all the valued parameters must be numbers');
            return false;
        }
    }
    return true;
}
// setting new session storage value 
function setNewSessionStorageFilters() {
    // overall filter object to persist 
    var newFilterObj = {}
    // all the filters concerning the dates 
    var datesSelections = (document.getElementById("intervalSelection").value != "None")
    newFilterObj["intervalSelection"] = createFilterSessionObj("intervalSelection", "Date", datesSelections)
    newFilterObj["min_date_filter"] = createFilterSessionObj("min_date_filter", "Date", datesSelections)
    newFilterObj["max_date_filter"] = createFilterSessionObj("max_date_filter", "Date", datesSelections)
    newFilterObj["min_time_filter"] = createFilterSessionObj("min_time_filter", "Date", datesSelections)
    newFilterObj["max_time_filter"] = createFilterSessionObj("max_time_filter", "Date", datesSelections)
    // all the filters concerning the sensors 
    for(var sensObj in OverallSensors) {
        var sensChecked = document.getElementById(OverallSensors[sensObj]['checkId']).checked;
        var sensVal = OverallSensors[sensObj]['filterId'];
        newFilterObj[OverallSensors[sensObj]['filterNameId']] = createFilterSessionObj(OverallSensors[sensObj]['name'], "Sensors", sensChecked, OverallSensors[sensObj]['id']);


        // getting the value for the adjustment of outliers on current sensor 
        var currAdjustIdSel = OverallSensors[sensObj]['adjustId'];
        var adjustRawVal = document.getElementById(currAdjustIdSel).value;
        var newValueForAdjustment = 0;
        if(adjustRawVal != '') {
            newValueForAdjustment = parseFloat(adjustRawVal);
        }
        newFilterObj[OverallSensors[sensObj]['filterNameId']].adjustmentValue = newValueForAdjustment;
        // console.log(newFilterObj[OverallSensors[sensObj]['filterNameId']]);
    }
    for(var gasObj in OverallGases) {
        var gasChecked = document.getElementById(OverallGases[gasObj]['checkId']).checked 
        var gasVal = OverallGases[gasObj]['filterId']
        newFilterObj[OverallGases[gasObj]['filterNameId']] = createFilterSessionObj(OverallGases[gasObj]['name'], "Gases", gasChecked, OverallGases[gasObj]['id'])
    }
    for(var sessionObj in OverallSessions) {
        var sessionChecked = document.getElementById(OverallSessions[sessionObj]['checkId']).checked 
        var sessionVal = OverallSessions[sessionObj]['filterId']
        newFilterObj[OverallSessions[sessionObj]['filterNameId']] = createFilterSessionObj(OverallSessions[sessionObj]['name'], "Sessions", sessionChecked, OverallSessions[sessionObj]['id'])
    }
    // other options 
    newFilterObj['visualizationType'] = createFilterSessionObj("visualizationType", "FilterOptions", true)
    newFilterObj['show_median'] = createFilterSessionObj("show_median", "FilterOptions", document.getElementById('show_median_check').checked)
    newFilterObj['temperature_time_graph'] = createFilterSessionObj("temperature_time_graph", "FilterOptions", document.getElementById('temperature_time_graph_check').checked)
    newFilterObj['humidity_time_graph'] = createFilterSessionObj("humidity_time_graph", "FilterOptions", document.getElementById('humidity_time_graph_check').checked)
    newFilterObj['ppms_temperature_graph'] = createFilterSessionObj("ppms_temperature_graph", "FilterOptions", document.getElementById('ppms_temperature_graph_check').checked)
    newFilterObj['ppms_humidity_graph'] = createFilterSessionObj("ppms_humidity_graph", "FilterOptions", document.getElementById('ppms_humidity_graph_check').checked)

    // the overall passed object 
    postFiltersObj = {};
    postFiltersObj.newFiltersConfig = newFilterObj
    postFiltersObj.gasColors = {};
    // verifying the presence of valorized colors for the gases to display
    if(Object.keys(GasColors).length) {
        postFiltersObj.gasColors = GasColors;
        // setting for new colors definition in the context of visualized gases
        for (var gasNameId in GasColors) {
            StoredGasColors[gasNameId] = GasColors[gasNameId];
        }
    }
    // adding possibly date modifications for the sessions 
    postFiltersObj.modifiedDateSessions = {}
    if(Object.keys(SessionsDateTimes).length) {
        for (var dateMod in SessionsDateTimes) {
            SessionsDateTimes[dateMod].modifiedDateStr = String(SessionsDateTimes[dateMod].modifiedDate);
        }

        postFiltersObj.modifiedDateSessions = SessionsDateTimes;
    }

    var filterObjToJSON = JSON.stringify(newFilterObj)
    var objPostDef = JSON.stringify(postFiltersObj)
    sessionStorage.setItem("filterOptions", filterObjToJSON)
    return objPostDef
}
// creating filter obj for POST request and successive session storage 
function createFilterSessionObj(filterID, filterContext, selected, dataContent) {
    var newFilterOption = {}
    var selectedInt = 0
    if(selected) {
        selectedInt = 1
    }
    newFilterOption["selected"] = selectedInt 
    newFilterOption["filter_context"] = filterContext
    newFilterOption["filter_name"] = filterID 
    if(dataContent !== undefined) {
        newFilterOption["filter_value"] = dataContent
    }
    else {
        if(typeof(document.getElementById(filterID).value) != 'undefined')
            newFilterOption["filter_value"] = document.getElementById(filterID).value
        else 
            newFilterOption["filter_value"] = document.getElementById(filterID).innerHTML
    }
    return newFilterOption
}