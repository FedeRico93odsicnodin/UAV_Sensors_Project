// global variables of all the data to manage 
var allTimeDivisionPoints = {}
var setCanvasPoints = []
var allChartsRefs = {}
var allSessionsId = {}
// getting the gasNameId from the selector id 
function getGasNameSessionIdFromSelectorId(selId) {
    var currIdParts = selId.split("_")
    var gasNameId = currIdParts[2] + "_" + currIdParts[3] + "_" + currIdParts[4]
    return gasNameId
}
// getting curr time range from selector id 
function getCurrTimeRangeFromSelectorId(selId) {
    var currIdParts = selId.split("_")
    var currTimeSel = currIdParts[1]
    return currTimeSel
}
// getting curr time from gas selection id 
function getCurrTimeFromCurrGasSelectionId(selId) {
    var currIdParts = selId.split("_")
    var currTimeSel = currIdParts[0]
    return currTimeSel
}
// getting gas name from id of the graph chart 
function getGasNameFromGraphId(graphId) {
    var currIdParts = graphId.split("_")
    var currGasName = currIdParts[1]
    return currGasName
}
// getting gasnameid from backward / forward move buttons 
function getGasNameIdFromBtnMovementsId(movId) {
    var currIdParts = movId.split("_")
    var currGasNameId = currIdParts[2] + "_" + currIdParts[3] + "_" + currIdParts[4]
    return currGasNameId
}
// getting visualization type from backward / forward move buttons 
function getTimeGraphFromBtnMovementsId(movId) {
    var currIdParts = movId.split("_")
    var currTime = currIdParts[1]
    return currTime
}
// changing the visualization because of new inverval selection 
function setNewIntervalGraph(sel) {
    // getting curr gasNameId and time interval 
    var gasNameSessionId = getGasNameSessionIdFromSelectorId(sel.id)
    var timeRange = getCurrTimeRangeFromSelectorId(sel.id)
    var currSelectedTime = document.getElementById(sel.id).value
    var selTimeInterval = 'intervalDashboardSel_' + currSelectedTime + "_" + gasNameSessionId
    // resetting the selection for the current visualized graph
    document.getElementById(sel.id).value = timeRange

    // creation of the selectors for the changing context 
    var oldRowVisualization = timeRange + "_"  + gasNameSessionId + "_row"
    var newRowVisualization = currSelectedTime + "_" + gasNameSessionId +  "_row"
    $("#" + oldRowVisualization).hide()
    $("#" + newRowVisualization).show()
}
// changing the visualization because of new points selection 
function setNewPointNumberGraph(sel) {
    // getting curr gasNameId and time interval 
    var gasNameSessionId = getGasNameSessionIdFromSelectorId(sel.id)
    var timeRange = getCurrTimeRangeFromSelectorId(sel.id)
    var currSelectionVal = parseInt(document.getElementById(sel.id).value)
    var contextArrowsMenuId = "moveButtons_"+ timeRange + "_" + gasNameSessionId
    // visualization of the curr context menu 
    if(currSelectionVal < allTimeDivisionPoints[timeRange + "_" + gasNameSessionId]["data"].length) {
        $("#" + contextArrowsMenuId).show() 
    }
    else {
        $("#" + contextArrowsMenuId).hide() 
    }
    // changing the visualization of points on curve 
    var gasVisualizationType = timeRange + "_" + gasNameSessionId
    // retrieving the line chart 
    var currGraphUpdate = allChartsRefs[gasVisualizationType]
    currGraphUpdate.destroy()
    // getting the curve for the current graph
    var currentCurve = allTimeDivisionPoints[gasVisualizationType]
    // getting the last points for visualize (only if enought points)
    if(currentCurve['data'].length < currSelectionVal) {
        console.log('same curve')
        return
    }
    // TODO: eventually take the first or the last set based on a decision
    var currentTimeInterval = currentCurve['labels'].slice(-currSelectionVal)
    var currentDataInterval = currentCurve['data'].slice(-currSelectionVal)
    var currGasName = getGasNameFromGraphId(gasVisualizationType)
    allChartsRefs[gasVisualizationType] = renderVisualizationPointsOnGraph(gasVisualizationType, currGasName, currentTimeInterval, currentDataInterval)
    checkArrowMovementsConsistency({"labels": currentTimeInterval, "data": currentDataInterval}, currentCurve, gasNameSessionId, timeRange)
}
// deciding how many selections for time visualizations add to curve  
function decideTimeIntervalSelection(gasNameSessionId, visualizationType, allPointsNum) {
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameSessionId
    var selStartHtml = '<select class="select" style="float:right" id="' + selTimeInterval + '" onchange="setNewIntervalGraph(this);">'
    + '<option value="mmm">mmm</option>'
    if(allPointsNum['ss_' + gasNameSessionId]["data"].length == 0) {
        selStartHtml += '</select>'
        return selStartHtml
    }
    // adding the second selection choice 
    selStartHtml += '<option value="ss">ss</option>'
    if(allPointsNum['mm_' + gasNameSessionId]["data"].length == 0) {
        selStartHtml += '</select>'
        return selStartHtml
    }
    // adding the minutes selection choice 
    selStartHtml += '<option value="mm">mm</option>'
    if(allPointsNum['hh_' + gasNameSessionId]["data"].length == 0) {
        selStartHtml += '</select>'
        return selStartHtml
    } 
    // adding the hour selection choice 
    selStartHtml += '<option value="hh">hh</option>'
    // conclusion of the selection tag 
    selStartHtml += '</select>'
    return selStartHtml
} 
// deciding how many selections for points to display on curve 
function decidePointsIntervalSelection(gasNameSessionId, visualizationType, currVisualizationNum) {
    // if num of points less than 5 the menu will not be created 
    if(currVisualizationNum < 5) {
        return ''
    }
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameSessionId
    var selStartHtml = '<select class="select" style="float:right;margin-right:10px" id="' + selPointsInterval + '" onchange="setNewPointNumberGraph(this);">'
    + '<option value="5">5</option>'
    if(currVisualizationNum < 10) {
        selStartHtml += '<option value="all">all</option>'
        selStartHtml += '</select>'
        return selStartHtml
    }
    selStartHtml += '<option value="10">10</option>'
    if(currVisualizationNum < 25) {
        selStartHtml += '<option value="all">all</option>'
        selStartHtml += '</select>'
        return selStartHtml
    }
    selStartHtml += '<option value="25">25</option>'
    if(currVisualizationNum < 50) {
        selStartHtml += '<option value="all">all</option>'
        selStartHtml += '</select>'
        return selStartHtml
    }
    selStartHtml += '<option value="50">50</option>'
    if(currVisualizationNum < 100) {
        selStartHtml += '<option value="all">all</option>'
        selStartHtml += '</select>'
        return selStartHtml
    }
    selStartHtml += '<option value="100">100</option>'
    selStartHtml += '<option value="all">all</option>'
    selStartHtml += '</select>'
    return selStartHtml
}
// eventual deactivation of the arrow movement on visualized set 
function checkArrowMovementsConsistency(currVisualizedSet, currOverallSet, gasNameId, visualizationType) {
    // checking if at the border of the set 
    var isLastSet = checkIfLastPointInSet(currVisualizedSet, currOverallSet)
    var isFirstSet = checkIfFitstPointInSet(currVisualizedSet, currOverallSet)
    // creating the selector for the movement commands 
    var forwardMovementArrowId = "moveBtnForward_" + visualizationType + "_" + gasNameId
    var forwardMovementInputId = "moveForwardValue_" + visualizationType + "_" + gasNameId
    var backwardMovementArrowId = "moveBtnBackward_" + visualizationType + "_" + gasNameId
    var backwardMovementInputId = "moveBackwardValue_" + visualizationType + "_" + gasNameId
    if(isLastSet) {
        $("#" + forwardMovementArrowId).hide()
        $("#" + forwardMovementInputId).hide()
    }
    else {
        $("#" + forwardMovementArrowId).show()
        $("#" + forwardMovementInputId).show()
    }
    if(isFirstSet) {
        $("#" + backwardMovementArrowId).hide()
        $("#" + backwardMovementInputId).hide()
    }
    else {
        $("#" + backwardMovementArrowId).show()
        $("#" + backwardMovementInputId).show()
    }
}
// moving backward on rendered graph
function moveBackward(arrId) {
    // getting the gas name id and visualization type 
    var gasNameId = getGasNameIdFromBtnMovementsId(arrId.id)
    var visualizationType = getTimeGraphFromBtnMovementsId(arrId.id)
    // getting the current step movement 
    var stepMovementId = "moveBackwardValue_" + visualizationType + "_" + gasNameId
    var currStepValue = parseInt(document.getElementById(stepMovementId).value)
    var currGraph = allChartsRefs[visualizationType + "_" + gasNameId]
    var firstLabelValue = currGraph.data.labels[0]
    var newDataToDisplay = getNewPointsDivisionInterval(
        gasNameId,
        visualizationType,
        currStepValue,
        "back",
        firstLabelValue
    )
    // no data to add to graph
    if(newDataToDisplay["labels"].length == 0) {
        return
    }
    var remainingData = currGraph.data.datasets[0].data.slice(0, currGraph.data.datasets[0].data.length - newDataToDisplay["labels"].length)
    var remainingLabels = currGraph.data.labels.slice(0, currGraph.data.labels.length - newDataToDisplay["labels"].length)
    for(var iData in remainingData) {
        newDataToDisplay["data"].push(remainingData[iData])
    }
    for(var iLabel in remainingLabels) {
        newDataToDisplay["labels"].push(remainingLabels[iLabel])
    }
    // verification and eventual deactivation of arrow movements 
    currGraph.data.labels = newDataToDisplay["labels"]
    currGraph.data.datasets[0].data = newDataToDisplay["data"]
    currGraph.update()
}
// moving forward on rendered graph
function moveForward(arrId) {
    // getting the gas name id 
    var gasNameId = getGasNameIdFromBtnMovementsId(arrId.id)
    var visualizationType = getTimeGraphFromBtnMovementsId(arrId.id)
    // getting the current step movement 
    var stepMovementId = "moveForwardValue_" + visualizationType + "_" + gasNameId
    var currStepValue = document.getElementById(stepMovementId).value
    var currGraph = allChartsRefs[visualizationType + "_" + gasNameId]
    var firstLabelValue = currGraph.data.labels[0]
    var newDataToDisplay = getNewPointsDivisionInterval(
        gasNameId,
        visualizationType,
        currStepValue,
        "next",
        firstLabelValue
    )
    if(newDataToDisplay["labels"].length == 0) {
        return
    }
    var remainingData = currGraph.data.datasets[0].data.slice(
        parseInt(newDataToDisplay["data"].length), 
        (currGraph.data.datasets[0].data.length))
    var remainingLabels = currGraph.data.labels.slice(
        parseInt(newDataToDisplay["labels"].length), 
        (currGraph.data.labels.length))
    for(var iData in newDataToDisplay["data"]) {
        remainingData.push(newDataToDisplay["data"][iData])
    }
    for(var iLabel in newDataToDisplay["labels"]) {
        remainingLabels.push(newDataToDisplay["labels"][iLabel])
    }
    // verification and eventual deactivation of arrow movements 
    
    currGraph.data.labels = remainingLabels
    currGraph.data.datasets[0].data = remainingData
    currGraph.update()
}
// getting the new point set on mevement through the graph
function getNewPointsDivisionInterval(gasNameId, visualizationType, numStep, direction, startIntervalPoint) {
    // getting the current gas curve points 
    var currIntervalsOnTime = allTimeDivisionPoints[visualizationType + "_" + gasNameId]
    if(direction == "next") {
        var indexOnCurve = 0
        // getting the current visualization step 
        var visualizationStepId = "pointsIntervalSel_" + visualizationType + "_" + gasNameId
        var visualizationStep = parseInt(document.getElementById(visualizationStepId).value)
        // counting the point before arriving to the last point on the showed curve 
        for(var i = 0; i < currIntervalsOnTime["labels"].length; i++) {
            if(currIntervalsOnTime["labels"][i] == startIntervalPoint) {
                indexOnCurve = i
                break
            }
        }
        var lastVisualizedIndx = indexOnCurve + visualizationStep
        if(lastVisualizedIndx >= currIntervalsOnTime["labels"].length) {
            // no data to return 
            return {"labels": [], "data": [] };
        }
        var arrLimitUpLabels = currIntervalsOnTime["labels"].slice(lastVisualizedIndx)
        var arrLimitUpData = currIntervalsOnTime["data"].slice(lastVisualizedIndx)
        var currLabelsInterval = []
        var currDataInterval = []
        if(arrLimitUpLabels.length < (parseInt(numStep) + 1)) {
            currLabelsInterval = arrLimitUpLabels
            currDataInterval = arrLimitUpData
        }
        else {
            currLabelsInterval = arrLimitUpLabels.slice(0, parseInt(numStep))
            currDataInterval = arrLimitUpData.slice(0, parseInt(numStep))
        }
        var currSetPoints =  {"labels": currLabelsInterval, "data": currDataInterval }
       
        // checking if arrows deactivation 
        checkArrowMovementsConsistency(currSetPoints, currIntervalsOnTime, gasNameId, visualizationType)
        return currSetPoints
    }
    else {
        var indexOnCurve = 0
        // counting the point before arriving to the selected value 
        for(var i = 0; i < currIntervalsOnTime["labels"].length; i ++) {
            if(currIntervalsOnTime["labels"][i] == startIntervalPoint) {
                indexOnCurve = i
                break
            }
        }
        if(indexOnCurve == 0) {
            // no data to return 
            return {"labels": [], "data": [] };;
        }
        var arrLimitDownLabels = currIntervalsOnTime["labels"].slice(0, indexOnCurve)
        var arrLimitDownData = currIntervalsOnTime["data"].slice(0, indexOnCurve)
        if(arrLimitDownLabels.length < numStep) {
            numStep = arrLimitDownLabels.length
        } 
        var currLabelsInterval = arrLimitDownLabels.slice(-numStep)
        var currDataInterval = arrLimitDownData.slice(-numStep)
        var currSetPoints = {"labels": currLabelsInterval, "data": currDataInterval }

        // checking if arrows deactivation 
        checkArrowMovementsConsistency(currSetPoints, currIntervalsOnTime, gasNameId, visualizationType)
        return currSetPoints
    }
}
// moving buttons through iterated points 
function getMovingButtonsHtml(gasNameId, visualizationType) {
    var moveForwardValueId = "moveForwardValue_" + visualizationType + "_" + gasNameId
    var moveBackwardValueId = "moveBackwardValue_" + visualizationType + "_" + gasNameId
    var gasNameIdMoveForward = "moveBtnForward_" + visualizationType + "_" + gasNameId
    var gasNameIdMoveBackward = "moveBtnBackward_" + visualizationType + "_" + gasNameId
    var gasNameIdMoveBtnsMenuId = "moveButtons_" + visualizationType + "_" + gasNameId
    var renderHtml = '<div style="margin-top:35px" id="' + gasNameIdMoveBtnsMenuId + '">' + 
    '<span onclick="moveBackward(this)" class="bi bi-arrow-left-circle" style="float:left;font-size: 1.5rem;" id="' + gasNameIdMoveBackward + '""></span>' + 
    '<input type="text" style="width:35px;height:20px;float:left;margin-left:7.5px;margin-top:8.5px" value="1" id="' + moveBackwardValueId + '"></input>'+
    
    '<span onclick="moveForward(this)" class="bi bi-arrow-right-circle" style="float:right;font-size: 1.5rem;" id="' + gasNameIdMoveForward +'"></span>' + 
    '<input type="text" style="width:35px;height:20px;float:right;margin-right:7.5px;margin-top:8.5px" value="1" id="' + moveForwardValueId + '"></input>'+
    '</div>'
    return renderHtml
}
// html for rendering single canvas gas visualizer
function createGasCanvas(gasName, gasSession, gasNameSessionId, visualizationType, selIntervalHtml, selPointsHtml) {
    // rendered html 
    var rowIdGasVisualization = visualizationType + "_" + gasNameSessionId + "_row"
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameSessionId
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameSessionId
    var gasVisualizationType = visualizationType + "_" + gasNameSessionId 
    var htmlCanvas ='<div class="row" id="' + rowIdGasVisualization + '">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div>' +
                                    '<h6 class="mb-0" style="float:left">' + gasName + ' - ' + gasSession + '</h6>' +
                                    selIntervalHtml + 
                                    selPointsHtml + 
                                '</div>' +
                                getMovingButtonsHtml(gasNameSessionId, visualizationType) + 
                                '<canvas id="' + gasVisualizationType + '"></canvas>' +
                            '</div>' +
                        '</div>' + 
                        '</div>'
                    '</div>'
    return htmlCanvas
}
// rendering the visualization for the current time interval 
function renderVisualizationPointsOnGraph(canvasId, gasName, visualizedInterval, visualizedData) {
    // getting the ID for the canvas and applying the data 
    console.log(canvasId);
    var canvGas = $("#" + canvasId).get(0).getContext("2d");
    var lineChart = new Chart(canvGas, {
        type: "line",
        options: {
            tension: 1,
            showLines: true,
            animation: {duration: 0},
            scales: {
                yAxes: [{
                display: true,
                ticks: {
                    beginAtZero:true,
                    min: 0,
                    max: 100  
                }
                }]
            }
        },
        data: {
            labels: visualizedInterval,
            datasets: [
                {
                    label: gasName,
                    data: visualizedData,
                    backgroundColor: "rgba(235, 22, 22, .5)",
                    fill: true
                }
            ]
            },
        options: {
            responsive: true
        }
    });
    return lineChart
}
// default selections 
function makeDefaultSelectionTimeCurve(gasNameId, defaultTimeSelection, defaultPointSelection, allTimeSelections) {
    // identifying the current gas context for rendered canvas
    var rowIdGasVisualization = defaultTimeSelection + "_" + gasNameId + "_row"
    // unique visualization for the current case of time selections 
    for(var currDisplayTime in allTimeSelections) {
        var selTimeInterval = 'intervalDashboardSel_' + currDisplayTime
        document.getElementById(selTimeInterval).value = getCurrTimeFromCurrGasSelectionId(currDisplayTime)
    }
    // default values for the selected points filter 
    for(var currDisplayTime in allTimeSelections) {
        var gasNameIdMoveBtnsMenuId = "moveButtons_" + currDisplayTime
        if(allTimeSelections[currDisplayTime]["data"].length < 5) {
            $("#" + gasNameIdMoveBtnsMenuId).hide()
            continue
        }
        var selPointsInterval = 'pointsIntervalSel_' + currDisplayTime
        document.getElementById(selPointsInterval).value = defaultPointSelection
        // no visualization for the context menu for moving on curve 
        if(defaultPointSelection == "all") {
            $("#" + gasNameIdMoveBtnsMenuId).hide()
        }
    } 
    for(var currDisplayTime in allTimeSelections) {
        var currIdGasVisualization = currDisplayTime + "_row"
        if(currIdGasVisualization.startsWith(defaultTimeSelection)) {
            $("#" + currIdGasVisualization).show()
            continue
        }
        $("#" + currIdGasVisualization).hide()
    }
}
// return the overall container to be inserted in the carousel 
function getOverallCarouselContainerOfGas(htmlGas) {
    return '<div>' + htmlGas + '</div>'
}
// creating the main body of graphs for the specific session 
function createBodyGraphsCurrSession(data, gasNameSessionId) {
    console.log('gasSessionId ' + gasNameSessionId)
    // getting data for default visualization
    var dataDisplayMMM = getDataToDisplayMMM(data)
    var dataDisplayS = getDataToDisplaySS(data)
    var dataDisplayM = getDataToDisplayMM(data)
    var dataDisplayH = getDataToDisplayHH(data)
    // no data to display for the basic case 
    if(dataDisplayMMM['data'].length == 0) {
        console.log("nothing to display")
        return ''
    }
    allTimeDivisionPoints["mmm_" + gasNameSessionId] = dataDisplayMMM 
    allTimeDivisionPoints["ss_" + gasNameSessionId] = dataDisplayS
    allTimeDivisionPoints["mm_" + gasNameSessionId] = dataDisplayM 
    allTimeDivisionPoints["hh_" + gasNameSessionId] = dataDisplayH
    // preparing the data for the milliseconds selections 
    // selections intervals
    var selIntervalsHtml = decideTimeIntervalSelection(gasNameSessionId, "mmm", allTimeDivisionPoints)
    var selPointsHtml = decidePointsIntervalSelection(gasNameSessionId, "mmm", allTimeDivisionPoints["mmm_" + gasNameSessionId]["data"].length)
    // canvas html creation
    var htmlCanvasAppend = createGasCanvas(data['gasName'], data['session'], gasNameSessionId, "mmm", selIntervalsHtml, selPointsHtml)
    setCanvasPoints.push({ "canvasId": "mmm_" + gasNameSessionId, "gasName": data['gasName'], "currSet": dataDisplayMMM })
    // creation of the visualization for the ss points 
    if(allTimeDivisionPoints["ss_" + gasNameSessionId]["data"].length > 0) {
        selIntervalsHtml = decideTimeIntervalSelection(gasNameSessionId, "ss", allTimeDivisionPoints)
        selPointsHtml = decidePointsIntervalSelection(gasNameSessionId, "ss", allTimeDivisionPoints["ss_" + gasNameSessionId]["data"].length)
        htmlCanvasAppend += createGasCanvas(data['gasName'], data['session'], gasNameSessionId, "ss", selIntervalsHtml, selPointsHtml)
        setCanvasPoints.push({ "canvasId": "ss_" + gasNameSessionId, "gasName": data['gasName'], "currSet": dataDisplayS })
    }
    // creation of the visualization for the mm points 
    if(allTimeDivisionPoints["mm_" + gasNameSessionId]["data"].length > 0) {
        selIntervalsHtml = decideTimeIntervalSelection(gasNameSessionId, "mm", allTimeDivisionPoints)
        selPointsHtml = decidePointsIntervalSelection(gasNameSessionId, "mm", allTimeDivisionPoints["mm_" + gasNameSessionId]["data"].length)
        htmlCanvasAppend += createGasCanvas(data['gasName'], data['session'], gasNameSessionId, "mm", selIntervalsHtml, selPointsHtml)
        setCanvasPoints.push({ "canvasId": "mm_" + gasNameSessionId, "gasName": data['gasName'], "currSet": dataDisplayM })
    }
    // creation of the visualization for the hh points 
    if(allTimeDivisionPoints["hh_" + gasNameSessionId]["data"].length > 0) {
        selIntervalsHtml = decideTimeIntervalSelection(gasNameSessionId, "hh", allTimeDivisionPoints)
        selPointsHtml = decidePointsIntervalSelection(gasNameSessionId, "hh", allTimeDivisionPoints["hh_" + gasNameSessionId]["data"].length)
        htmlCanvasAppend += createGasCanvas(data['gasName'], data['session'], gasNameSessionId, "hh", selIntervalsHtml, selPointsHtml)
        setCanvasPoints.push({ "canvasId": "hh_" + gasNameSessionId, "gasName": data['gasName'], "currSet": dataDisplayH })
    }
    // creation of the overall container to be inserted in the carousel 
    var overallHtmlCarousel = getOverallCarouselContainerOfGas(htmlCanvasAppend)
    return overallHtmlCarousel
}
// insertion of new session id 
function insertNewSessionId(loadedSessionId) {
    if(loadedSessionId in allSessionsId) {
        return
    }
    allSessionsId[loadedSessionId] = true
}
// iteration for rendering the selected filtered substances
function loadDashboardData() {
    // initializing dashboard parameters 
    allTimeDivisionPoints = {}
    setCanvasPoints = []
    allChartsRefs = {}
    allSessionsId = {}
    var allGasesToRetrieve = getGasesToDisplay()
    // reset of all attributes data to manage 
    $('#dashboardContent').empty()
    for(var currGas in allGasesToRetrieve) {
        $.ajax({
            type: "POST",
            url: "/gasdata",
            data: JSON.stringify(allGasesToRetrieve[currGas]),
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                // somthing wrong in the call
                if(data['status'].startsWith("ok_") == false) {
                    console.log("nothing to display")
                    return 
                }
                // no data to display ù
                if(data['gasData'].length == 0) {
                    console.log("nothing to display")
                    return 
                }
                setCanvasPoints = []
                // gas identification ids
                var gasNameId = data['gasName'] + "_" + data['gasId']
                var gasNameSessionIds = []
                // getting the splitted data on sessions 
                var splittedDataSessions = getSplittedSessionsData(data)
                // variable for all displayed chart of the carousel 
                var allDisplayedChartSessions = []
                // init the html container for each of the data of the retrieved sessions 
                for(var i in splittedDataSessions) {
                    // eventual replace for the space strings 
                    gasNameReplace = String(splittedDataSessions[i]['gasName']);
                    gasIdReplace = String(splittedDataSessions[i]['gasId']);
                    gasSessionReplace = String(splittedDataSessions[i]['sessionID']);
                    splittedDataSessions[i]['gasName'] = gasNameReplace.replace(' ', 'e');
                    splittedDataSessions[i]['gasId'] = gasIdReplace.replace(' ', 'e');
                    splittedDataSessions[i]['sessionID'] = gasSessionReplace.replace(' ', 'e');
                    gasNameSessionId = splittedDataSessions[i]['gasName'] + "_" + splittedDataSessions[i]['gasId'] + '_session' + splittedDataSessions[i]['sessionID']

                    // mapping the current session id 
                    insertNewSessionId(splittedDataSessions[i]['sessionID'])
                    gasNameSessionIds.push(gasNameSessionId)
                    var currHtmlRender = createBodyGraphsCurrSession(splittedDataSessions[i], gasNameSessionId)
                    allDisplayedChartSessions.push(currHtmlRender)
                }
                // create html canvas and carousel and render it 
                initSessionsCarousel(allDisplayedChartSessions, gasNameId, setCanvasPoints)
                // default selections for current graph curve 
                for(var i in gasNameSessionIds) {
                    makeDefaultSelectionTimeCurve(gasNameSessionIds[i], "mmm", "all", allTimeDivisionPoints)
                }
                
            },
            error: function(err) {
                console.log('error saving filters\n' + err)
            }
          });
    }
}
// preparation of the carousel elements 
function prepareCarouselHtml(htmlContentArray) {
    var allHtmlContentCarousel = ''
    for(var i in htmlContentArray) {
        var currHtmlElement = ''
        // the first element will be the active one 
        if(i == 0) {
            currHtmlElement = '<div class="carousel-item active">' + htmlContentArray[i] + '</div>'
            allHtmlContentCarousel += currHtmlElement
            continue
        }
        currHtmlElement = '<div class="carousel-item">' + htmlContentArray[i] + '</div>'
        allHtmlContentCarousel += currHtmlElement
    }
    
    return allHtmlContentCarousel
}
// render the canvas for the selected gas 
function renderGasCanvas(currCanvasDataArr) {
    for(var i in currCanvasDataArr) {
        currChart = renderVisualizationPointsOnGraph(
            currCanvasDataArr[i].canvasId, 
            currCanvasDataArr[i].gasName,
            currCanvasDataArr[i].currSet.labels,
            currCanvasDataArr[i].currSet.data
            )
        allChartsRefs[currCanvasDataArr[i].canvasId] = currChart
    }
}
// creation of the main carousel if more of one sessions are selected 
function initSessionsCarousel(htmlContentArray, gasNameId, canvasPointsObj) {
    var htmlContentCarousel = prepareCarouselHtml(htmlContentArray)
    // init session carousel 
    var gasCarouselId = 'gasCarousel_' + gasNameId
    // creating and appending the overall carousel
    var carouselHtml = getCarouselMainHtml(htmlContentCarousel, gasCarouselId)
    $('#dashboardContent').append(carouselHtml)
    // rendering the canvas for all the data of the current gas 
    renderGasCanvas(canvasPointsObj)
    // TODO: understand if necessary jquery ....
    if(document.getElementById('carouselExampleControls') == null) {
        $('#' + gasCarouselId).carousel({
            interval: false
          })
    }
}
// getting the html for the principal carousel 
function getCarouselMainHtml(htmlContentArray, carouselId) {
    var carouselHtml = 
    '<div id="' + carouselId + '" class="row carousel slide carousel-fade" data-bs-ride="carousel" style="margin-top:25px">'
    +'<div class="carousel-inner">'
    +  htmlContentArray
    +'</div>'
    +'<button class="carousel-control-prev" style="width:5%" type="button" data-bs-target="#' + carouselId + '" data-bs-slide="prev">'
    +  '<span class="carousel-control-prev-icon" aria-hidden="true"></span>'
    +  '<span class="visually-hidden">Previous</span>'
    +'</button>'
    +'<button class="carousel-control-next" style="width:5%" type="button" data-bs-target="#' + carouselId + '" data-bs-slide="next">'
    +  '<span class="carousel-control-next-icon" aria-hidden="true"></span>'
    +  '<span class="visually-hidden">Next</span>'
    +'</button>'
    +'</div>'
    return carouselHtml
}