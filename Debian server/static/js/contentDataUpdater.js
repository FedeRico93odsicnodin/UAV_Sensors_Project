/**
 * script for data update after a certain time interval 
 * sessions will be refreshed based on current selections and 
 * according to new incoming data from the server 
 */
// retrieving the gas id from current selector 
function getGasIdFromSelector(selector) {
    var selectorParts = selector.split("_")
    var currGasId = parseInt(selectorParts[2])
    return currGasId
}
// retrieving the gas name from current selector 
function getGasNameFromSelector(selector) {
    var selectorParts = selector.split("_")
    var currGasName = selectorParts[1]
    return currGasName
}
// getting the input for the POST for retrieving new data 
function getUpTimesObjGases() {
    var currInputsPost = {}
    for(var gasRangeSelector in allTimeDivisionPoints) {
        if(gasRangeSelector.startsWith("mmm") == false) {
            continue
        }
        var gasId = getGasIdFromSelector(gasRangeSelector)
        var gasName = getGasNameFromSelector(gasRangeSelector)
        var gasNameId = gasName + "_" + gasId
        // TODO: just a test 
        var lastLabelIndex = allTimeDivisionPoints[gasRangeSelector].labels.length - 11
        var lastGasLabel = allTimeDivisionPoints[gasRangeSelector].labels[lastLabelIndex]
        var lastGasLabelConversion = new Date(lastGasLabel)
        var currObjGas = {"gasId": gasId, "gasName": gasName, "upTime": lastGasLabel, "upTimeConv": lastGasLabelConversion}
        if(gasNameId in currInputsPost) {
            if(currInputsPost[gasNameId].upTimeConv < currObjGas.upTimeConv) {
                currInputsPost[gasNameId] = currObjGas
            }
            continue
        }
        currInputsPost[gasNameId] = currObjGas
    }
    return currInputsPost
}
function reloadData() {
    // TODO: implementation of reload filters 
    // getting current up times for the displayed gases 
    var currGasNewSelectionsObj = getUpTimesObjGases()
    // invoking post request for getting gas data 
    for(var currGas in currGasNewSelectionsObj) {
        $.ajax({
            type: "POST",
            url: "/gasdata_reload",
            data: JSON.stringify(currGasNewSelectionsObj[currGas]),
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                console.log(data)
                // TODO: adding the points to the already present points 
                // TODO (2): on basis of the visualization of all the points on graph, refreshing them 
            },
            error: function(err) {
                console.log('error saving filters\n' + err)
            }
          });
    }
}
function startUpdaterScript() {
    setInterval(reloadData, 5000)
}