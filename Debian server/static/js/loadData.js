/**
 * Script for initial storage of all filters (selected by default) and then load all
 * the data 
 * Particularly on the ready function if no data is in the storage filters and initial 
 * population will be made 
 */
// loading phase flag: some activities are not active 
isLoadingPhase = true
// getting the initial data 
function getInitialData(callBackLoad, errLoad) {
    $.ajax({
        url: "/filters/allstored"
        , success: function(data) { callBackLoad(data) }
        , error: function(err) { errLoad(err) }
    })
}
// saving the filters configuration 
function saveFiltersConfig(newJSONFilters, callBackLoad, errLoad) {
    $.ajax({
        type: "POST",
        url: "/filters/allstored",
        data: newJSONFilters,
        contentType: "application/json",
        dataType: 'json',
        success: function(data) { callBackLoad(data) },
        error: function(err) { errLoad(err) }
      });
}
// init all filters for the first load of data 
function initAllDataAndFilters(data) {
    // storing all the filters and then load all the data
    if(data == "{}") {
        console.log('filters to load')
    }
    // setting initial data 
    sessionStorage.setItem("filterOptions", data)
    // initial set of all filters
    initAllFilters(filterCallbackMainLoad)
    // initial load completed 
    isLoadingPhase = false
    // starting the update phase script 
    startUpdaterScript()
}

function filterCallbackMainLoad() {
    // getting all the values of the filters 
    var newJSONFilters = setNewSessionStorageFilters()
    // calling for posting data filters with reload 
    saveFiltersConfig(newJSONFilters, reloadAllData, function(err) {
        console.log('error verification in first configuration')
    })
}

function reloadAllData(data) {
    if(data.status != 'ok') {
        console.log('error verified in first save of filters')
       
    }
    backToDashboardReload()
}