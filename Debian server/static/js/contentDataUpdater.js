/**
 * script for data update after a certain time interval 
 * sessions will be refreshed based on current selections and 
 * according to new incoming data from the server 
 */
// object gas matrix: checking if curve is to update or not 
var currGasUpdatingCurveMatrix = {}
// object gas matrix with new reference ids to be added to the curve 
var currGasNewPointsCurveMatrix = {}
// set difference for points to add on curves 
var currSetPointsDifference = {}
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
        var lastLabelIndex = allTimeDivisionPoints[gasRangeSelector].labels.length - 1
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
    // getting currently visualized points
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
// checking if current graph is to update or not
function checkIfCurrGraphToUpdate(graphId) {
    if(currGasUpdatingCurveMatrix[graphId].lastSetCurve == false) {
        return false
    }
    if(currGasUpdatingCurveMatrix[graphId].newPoints == false) {
        return false
    }
    return true
}
// adding current gas to refresh matrix 
function addCurrGasRefForUpdateGraph(gasNameSessionId) {
    // for updating the graph: new points available and last set on curve is visualized 
    currGasUpdatingCurveMatrix["mmm_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["ss_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["mm_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
    currGasUpdatingCurveMatrix["hh_" + gasNameSessionId] = {"newPoints": false, "lastSetCurve": false }
}
// cleaning method which returns no overlap set of data to be added for the current graph and overall visualization points 
function getNoOverlappedDataVisualization(newPointsToAdd, lastElementInSet) {
    var cleanedPointsToAdd = {}
    if(newPointsToAdd["labels"].includes(lastElementInSet)) {
        console.log('TRUE INCLUSION')
        var indexOfStart = newPointsToAdd["labels"].indexOf(lastElementInSet) + 1
        if(indexOfStart < newPointsToAdd["labels"].length) {
            cleanedPointsToAdd["labels"] = newPointsToAdd["labels"].slice(indexOfStart)
            cleanedPointsToAdd["data"] = newPointsToAdd["data"].slice(indexOfStart)
        }
    }
    else {
        cleanedPointsToAdd = newPointsToAdd
    }
    return cleanedPointsToAdd
}
// adding points on graph strategy 
function updateGraphWithNewPoints(gasNameSessionId, currVisualization) {
    // getting current graph reference for point addition 
    var currGraphRef = allChartsRefs[gasNameSessionId]
    // getting points difference for labels and data 
    var newPointsToAdd = currSetPointsDifference[gasNameSessionId]
    switch(currVisualization) {
        // in case of all points have to add all new entries to the set 
        case "all": {
            for(var i in newPointsToAdd["labels"]) {
                currGraphRef.data.labels = allTimeDivisionPoints[gasNameSessionId]["labels"]
            }
            for(var j in newPointsToAdd["data"]) {
                currGraphRef.data.datasets[0].data = allTimeDivisionPoints[gasNameSessionId]["data"]
            }
            currGraphRef.update()
        }
    }
}
// update last points visualized ib graph
function insertNewPointsOnGraphVisualization(gasNameSessionId) {
    // selector for the current points visualization 
    var currPointsSelector = 'pointsIntervalSel_' + gasNameSessionId
    // the current visualization for the selected points is not active s
    if(document.getElementById(currPointsSelector) == null) {
        return
    }
    // curr selected visualized points on curve 
    var currVisualizationPoints = document.getElementById(currPointsSelector).value
    // the selector for the current visualized graph 
    var currSelVisualized = 'intervalDashboardSel_' + gasNameSessionId
    // getting the current graph reference by the interval selection
    var currIntervalSelector = document.getElementById(currSelVisualized)
    // curr selected interval 
    var currSelectedTimeInterval = document.getElementById(currSelVisualized).value 
    // updating current selected curve 
    updateGraphWithNewPoints(gasNameSessionId, currVisualizationPoints)
}
// getting the last element of type labels for the selected overall set 
function getLastLabelElementForSet(setSelId) {
    return allTimeDivisionPoints[setSelId].labels[allTimeDivisionPoints[setSelId].labels.length - 1]
}
// preparing and distinguishing current data (already present session id)
function addCurrentDataToExistingSet(dataToAdd, gasNameSessionId) {
    
    // getting data for default visualization
    var dataDisplayMMM = getDataToDisplayMMM(dataToAdd)
    // no data to display for the basic case 
    if(dataDisplayMMM['data'].length == 0) {
        console.log('no data for the ref ' + gasNameSessionId)
        return
    }
    // adding current gas reference for update to matrix 
    addCurrGasRefForUpdateGraph(gasNameSessionId)
    var dataDisplayS = getDataToDisplaySS(dataToAdd)
    var dataDisplayM = getDataToDisplayMM(dataToAdd)
    var dataDisplayH = getDataToDisplayHH(dataToAdd)
    // adding the points for current gas (milliseconds)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "mmm")
    // cleaning the data with eventual overlap points 
    var lastElementMMM = getLastLabelElementForSet("mmm_" + gasNameSessionId)
    dataDisplayMMM = getNoOverlappedDataVisualization(
        dataDisplayMMM, 
        lastElementMMM
        )
    allTimeDivisionPoints["mmm_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["mmm_" + gasNameSessionId]['labels'].concat(dataDisplayMMM['labels']) 
    allTimeDivisionPoints["mmm_" + gasNameSessionId]['data'] = allTimeDivisionPoints["mmm_" + gasNameSessionId]['data'].concat(dataDisplayMMM['data']) 
    currSetPointsDifference["mmm_" + gasNameSessionId] = dataDisplayMMM
    setCheckPointControlPassed(gasNameSessionId, "mmm")
    if(dataDisplayS['data'].length == 0) {
        return
    }
    // adding the points for current gas (seconds)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "ss")
    // cleaning the data with eventual overlap points 
    var lastElementS = getLastLabelElementForSet("ss_" + gasNameSessionId)
    dataDisplayS = getNoOverlappedDataVisualization(
        dataDisplayS, 
        lastElementS
        )
    allTimeDivisionPoints["ss_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["ss_" + gasNameSessionId]['labels'].concat(dataDisplayS['labels']) 
    allTimeDivisionPoints["ss_" + gasNameSessionId]['data'] = allTimeDivisionPoints["ss_" + gasNameSessionId]['data'].concat(dataDisplayS['data']) 
    currSetPointsDifference["ss_" + gasNameSessionId] = dataDisplayS
    setCheckPointControlPassed(gasNameSessionId, "ss")
    if(dataDisplayM['data'].length == 0) {
        return
    }
    // adding the points for current gas (minutes)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "mm")
    // cleaning the data with eventual overlap points 
    var lastElementM = getLastLabelElementForSet("mm_" + gasNameSessionId)
    dataDisplayM = getNoOverlappedDataVisualization(
        dataDisplayM, 
        lastElementM
        )
    allTimeDivisionPoints["mm_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["mm_" + gasNameSessionId]['labels'].concat(dataDisplayM['labels'])  
    allTimeDivisionPoints["mm_" + gasNameSessionId]['data'] = allTimeDivisionPoints["mm_" + gasNameSessionId]['data'].concat(dataDisplayM['data']) 
    currSetPointsDifference["mm_" + gasNameSessionId] = dataDisplayM
    setCheckPointControlPassed(gasNameSessionId, "mm") 
    if(dataDisplayH['data'].length == 0) {
        return
    }
    // adding the points for current gas (hours)
    checkIfLastPointsOnCurveVisualized(gasNameSessionId, "hh")
    // cleaning the data with eventual overlap points 
    var lastElementH = getLastLabelElementForSet("hh_" + gasNameSessionId)
    dataDisplayH = getNoOverlappedDataVisualization(
        dataDisplayH, 
        lastElementH
        )
    allTimeDivisionPoints["hh_" + gasNameSessionId]['labels'] = allTimeDivisionPoints["hh_" + gasNameSessionId]['labels'].concat(dataDisplayH['labels']) 
    allTimeDivisionPoints["hh_" + gasNameSessionId]['data'] = allTimeDivisionPoints["hh_" + gasNameSessionId]['data'].concat(dataDisplayH['data']) 
    currSetPointsDifference["hh_" + gasNameSessionId] = dataDisplayH
    setCheckPointControlPassed(gasNameSessionId, "hh")
   
}
// updating the graph on bases on collected checks on graph selection 
function updateGraphsCurrentSelections() {
    for(var currGraphIdRef in currGasUpdatingCurveMatrix) {
        if(checkIfCurrGraphToUpdate(currGraphIdRef) == false) {
            continue
        }
        insertNewPointsOnGraphVisualization(currGraphIdRef)
    }
}
// checking if the retrieved session id is already visualized in the selected set 
function checkSessionIdDataVisualized(retrievedSessionId) {
    if(retrievedSessionId in allSessionsId) {
        return true
    }
    return false
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
    currSetPointsDifference = {}
    // getting current up times for the displayed gases 
    var currGasNewSelectionsObj = getUpTimesObjGases()
    // checking if data is returned, on contrary invoking refresh 
    if(Object.keys(currGasNewSelectionsObj).length === 0) {
        document.location.reload();
    }
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
                // forcing page reload with a new session 
                var pageReload = false
                for(var i in splittedDataSessions) {
                    gasNameSessionId = splittedDataSessions[i]['gasName'] + "_" + splittedDataSessions[i]['gasId'] + '_session' + splittedDataSessions[i]['sessionID']
                    gasNameSessionIds.push(gasNameSessionId)
                    if(checkSessionIdDataVisualized(splittedDataSessions[i]['sessionID'])) {
                        addCurrentDataToExistingSet(splittedDataSessions[i], gasNameSessionId)
                        continue 
                    }
                    // forcing the relaod of the browser including the points of the added session
                    pageReload = true
                }
                // new session will be loaded 
                if(pageReload) {
                    document.location.reload();
                }
                // updating the points of the added session 
                else {
                    updateGraphsCurrentSelections()
                }
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