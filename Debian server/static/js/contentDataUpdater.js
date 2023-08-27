/**
 * script for data update after a certain time interval 
 * sessions will be refreshed based on current selections and 
 * according to new incoming data from the server 
 */
// object gas matrix: checking if curve is to update or not 
var currGasUpdatingCurveMatrix = {}
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
// verifying if last points on curves are visualized: NB to invoke before points addition  
function checkIfLastPointsOnCurveVisualized(gasNameSessionId, visualizationType) {
    // getting the whole dataset for the gas 
    var allSet = allTimeDivisionPoints[visualizationType + "_" + gasNameSessionId]
    // gettting currently visualized points
    var currGraph = allChartsRefs[visualizationType + "_" + gasNameSessionId]
    var visualizedLabels = currGraph.data.labels
    var visualizedData = currGraph.data.datasets[0].data
    // creating object for the function of check
    var objVisualized = {"labels": visualizedLabels, "data": visualizedData}
    // calling the function check
    var isLastPointCurveVisualized = checkIfLastPointInSet(objVisualized, allSet)
    if(isLastPointCurveVisualized) {
        setCheckLastPointControlPassed(gasNameSessionId, visualizationType)
    }
}
// updating check if last point visualized on curve 
function setCheckLastPointControlPassed(gasNameSessionId, visualizationType) {
    currGasUpdatingCurveMatrix[visualizationType + "_" + gasNameSessionId].lastSetCurve = true
}
// updating check new points for the matrix 
function setCheckPointControlPassed(gasNameSessionId, visualizationType) {
    currGasUpdatingCurveMatrix[visualizationType + "_" + gasNameSessionId].newPoints = true
}
// adding current gas to refresh matrix 
function addCurrGasRefForUpdateGraph(gasNameSessionId) {
    // for updating the graph: new points available and last set on curve is visualized 
    currGasUpdatingCurveMatrix["mmm_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["ss_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["mm_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["hh_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
}
// preparing and distinguishing current data 
function addCurrentDataToSet(dataToAdd, gasNameSessionId) {
    // adding current gas reference for update to matrix 
    addCurrGasRefForUpdateGraph(gasNameSessionId)
    // getting data for default visualization
    var dataDisplayMMM = getDataToDisplayMMM(dataToAdd)
    var dataDisplayS = getDataToDisplaySS(dataToAdd)
    var dataDisplayM = getDataToDisplayMM(dataToAdd)
    var dataDisplayH = getDataToDisplayHH(dataToAdd)
    // no data to display for the basic case 
    if(dataDisplayMMM['data'].length == 0) {
        return
    }
    // adding the points for current gas (milliseconds)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "mmm")
    allTimeDivisionPoints["mmm_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["mmm_" + gasNameSessionId]['labels'].concat(dataDisplayMMM['labels']) 
    allTimeDivisionPoints["mmm_" + gasNameSessionId]['data'] = allTimeDivisionPoints["mmm_" + gasNameSessionId]['data'].concat(dataDisplayMMM['data']) 
    setCheckPointControlPassed(gasNameSessionId, "mmm")
    if(dataDisplayS['data'].length == 0) {
        return
    }
    // adding the points for current gas (seconds)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "ss")
    allTimeDivisionPoints["ss_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["ss_" + gasNameSessionId]['labels'].concat(dataDisplayS['labels']) 
    allTimeDivisionPoints["ss_" + gasNameSessionId]['data'] = allTimeDivisionPoints["ss_" + gasNameSessionId]['data'].concat(dataDisplayS['data']) 
    setCheckPointControlPassed(gasNameSessionId, "ss")
    if(dataDisplayM['data'].length == 0) {
        return
    }
    // adding the points for current gas (minutes)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "mm")
    allTimeDivisionPoints["mm_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["mm_" + gasNameSessionId]['labels'].concat(dataDisplayM['labels'])  
    allTimeDivisionPoints["mm_" + gasNameSessionId]['data'] = allTimeDivisionPoints["mm_" + gasNameSessionId]['data'].concat(dataDisplayM['data']) 
    setCheckPointControlPassed(gasNameSessionId, "mm") 
    if(dataDisplayH['data'].length == 0) {
        return
    }
    // adding the points for current gas (hours)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "hh")
    allTimeDivisionPoints["hh_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["hh_" + gasNameSessionId]['labels'].concat(dataDisplayH['labels']) 
    allTimeDivisionPoints["hh_" + gasNameSessionId]['data'] = allTimeDivisionPoints["hh_" + gasNameSessionId]['data'].concat(dataDisplayH['data']) 
    setCheckPointControlPassed(gasNameSessionId, "hh")
}
// function of addition of points on current curves
function reloadData() {
    // TODO: implementation of reload filters 
    if(isFilterContext) {
        console.log('data refresh standby')
        return
    }
    // resetting matrix update 
    currGasUpdatingCurveMatrix = {}
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
                if(data['gasData'].length == 0) {
                    console.log('no new data to display')
                    return 
                }
                // getting datas splitted by session 
                var splittedDataSessions = getSplittedSessionsData(data)
                // adding the points for the current session 
                gasNameSessionIds = []
                for(var i in splittedDataSessions) {
                    gasNameSessionId = splittedDataSessions[i]['gasName'] + "_" + splittedDataSessions[i]['gasId'] + '_session' + splittedDataSessions[i]['sessionID']
                    gasNameSessionIds.push(gasNameSessionId)
                    addCurrentDataToSet(splittedDataSessions[i], gasNameSessionId)
                }
                console.log(currGasUpdatingCurveMatrix)
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