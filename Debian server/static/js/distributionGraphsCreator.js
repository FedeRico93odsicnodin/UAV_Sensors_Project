// global variables of all the data to manage 
var allTimeDivisionPoints = {}
var allChartsRefs = {}
// getting the gasNameId from the selector id 
function getGasNameIdFromSelectorId(selId) {
    var currIdParts = selId.split("_")
    var gasNameId = currIdParts[2] + "_" + currIdParts[3]
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
    var currGasNameId = currIdParts[2] + "_" + currIdParts[3]
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
    var gasNameId = getGasNameIdFromSelectorId(sel.id)
    var timeRange = getCurrTimeRangeFromSelectorId(sel.id)
    var currSelectedTime = document.getElementById(sel.id).value
    var selTimeInterval = 'intervalDashboardSel_' + currSelectedTime + "_" + gasNameId
    console.log(timeRange)
    console.log(selTimeInterval)
    // resetting the selection for the current visualized graph
    document.getElementById(sel.id).value = timeRange

    // creation of the selectors for the changing context 
    var oldRowVisualization = timeRange + "_"  + gasNameId + "_row"
    var newRowVisualization = currSelectedTime + "_" + gasNameId +  "_row"
    $("#" + oldRowVisualization).hide()
    $("#" + newRowVisualization).show()
}
// changing the visualization because of new points selection 
function setNewPointNumberGraph(sel) {
    // getting curr gasNameId and time interval 
    var gasNameId = getGasNameIdFromSelectorId(sel.id)
    var timeRange = getCurrTimeRangeFromSelectorId(sel.id)
    var currSelectionVal = parseInt(document.getElementById(sel.id).value)
    var contextArrowsMenuId = "moveButtons_"+ timeRange + "_" + gasNameId
    console.log(currSelectionVal)
    // visualization of the curr context menu 
    if(currSelectionVal < allTimeDivisionPoints[timeRange + "_" + gasNameId]["data"].length) {
        $("#" + contextArrowsMenuId).show() 
    }
    else {
        $("#" + contextArrowsMenuId).hide() 
    }
    // changing the visualization of points on curve 
    var gasVisualizationType = timeRange + "_" + gasNameId
    // retrieving the line chart 
    var currGraphUpdate = allChartsRefs[gasVisualizationType]
    console.log(currGraphUpdate)
    currGraphUpdate.destroy()
    // getting the curve for the current graph
    var currentCurve = allTimeDivisionPoints[gasVisualizationType]
    console.log(currentCurve)
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
}
// deciding how many selections for time visualizations add to curve  
function decideTimeIntervalSelection(gasNameId, visualizationType, allPointsNum) {
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameId
    var selStartHtml = '<select class="select" style="float:right" id="' + selTimeInterval + '" onchange="setNewIntervalGraph(this);">'
    + '<option value="mmm">mmm</option>'
    if(allPointsNum['ss_' + gasNameId]["data"].length == 0) {
        selStartHtml += '</select>'
        return selStartHtml
    }
    // adding the second selection choice 
    selStartHtml += '<option value="ss">ss</option>'
    if(allPointsNum['mm_' + gasNameId]["data"].length == 0) {
        selStartHtml += '</select>'
        return selStartHtml
    }
    // adding the minutes selection choice 
    selStartHtml += '<option value="mm">mm</option>'
    if(allPointsNum['hh_' + gasNameId]["data"].length == 0) {
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
function decidePointsIntervalSelection(gasNameId, visualizationType, currVisualizationNum) {
    // if num of points less than 5 the menu will not be created 
    if(currVisualizationNum < 5) {
        return ''
    }
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameId
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
function moveBackward(arrId) {
    // getting the gas name id and visualization type 
    var gasNameId = getGasNameIdFromBtnMovementsId(arrId.id)
    var visualizationType = getTimeGraphFromBtnMovementsId(arrId.id)
    // getting the current step movement 
    var stepMovementId = "moveBackwardValue_" + visualizationType + "_" + gasNameId
    var currStepValue = parseInt(document.getElementById(stepMovementId).value)
    var currGraph = allChartsRefs[visualizationType + "_" + gasNameId]
    var firstLabelValue = currGraph.data.labels[0]
    console.log(currStepValue)
    var newDataToDisplay = getNewPointsDivisionInterval(
        gasNameId,
        visualizationType,
        currStepValue,
        "back",
        firstLabelValue
    )
    var remainingData = currGraph.data.datasets[0].data.slice(0, currGraph.data.datasets[0].data.length - currStepValue)
    var remainingLabels = currGraph.data.labels.slice(0, currGraph.data.labels.length - currStepValue)
    for(var iData in remainingData) {
        newDataToDisplay["data"].push(remainingData[iData])
    }
    for(var iLabel in remainingLabels) {
        newDataToDisplay["labels"].push(remainingLabels[iLabel])
    }
    currGraph.data.labels = [, 
    ]
    currGraph.data.labels = newDataToDisplay["labels"]
    currGraph.data.datasets[0].data = newDataToDisplay["data"]
    currGraph.update()
}
function moveForward(arrId) {
    // getting the gas name id 
    var gasNameId = getGasNameIdFromBtnMovementsId(arrId.id)
    var visualizationType = getTimeGraphFromBtnMovementsId(arrId.id)
    // getting the current step movement 
    var stepMovementId = "moveForwardValue_" + visualizationType + "_" + gasNameId
    var currStepValue = document.getElementById(stepMovementId).value
    console.log(currStepValue)
}
function getNewPointsDivisionInterval(gasNameId, visualizationType, numStep, direction, startIntervalPoint) {
    // getting the current gas curve points 
    var currIntervalsOnTime = allTimeDivisionPoints[visualizationType + "_" + gasNameId]
    if(direction == "next") {
        var indexOnCurve = 0
        // counting the point before arriving to the last point on the showed curve 
        for(var i = 0; i < currIntervalsOnTime["labels"].length; i++) {
            if(currIntervalsOnTime["labels"][i] == startIntervalPoint) {
                indexOnCurve = i
                break
            }
        }
        var lastVisualizedIndx = indexOnCurve + numStep
        if(lastVisualizedIndx >= currIntervalsOnTime["labels"].length - 1) {
            return;
        }
        // TODO: continuing the implementation for the move forward  
        var arrLimitDownLabels = currIntervalsOnTime["labels"].slice(lastVisualizedIndx, currIntervalsOnTime["labels"].length - lastVisualizedIndx)
        var arrLimitDownData = currIntervalsOnTime["data"].slice(lastVisualizedIndx, currIntervalsOnTime["labels"].length - lastVisualizedIndx)
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
            return;
        }
        var arrLimitDownLabels = currIntervalsOnTime["labels"].slice(0, indexOnCurve -1)
        var arrLimitDownData = currIntervalsOnTime["data"].slice(0, indexOnCurve -1)
        if(arrLimitDownLabels.length < numStep) {
            numStep = arrLimitDownLabels.length
        } 
        var currLabelsInterval = arrLimitDownLabels.slice(-numStep)
        var currDataInterval = arrLimitDownData.slice(-numStep)
        return {"labels": currLabelsInterval, "data": currDataInterval}
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
function createGasCanvas(gasName, gasNameId, visualizationType, selIntervalHtml, selPointsHtml) {
    // rendered html 
    var rowIdGasVisualization = visualizationType + "_" + gasNameId + "_row"
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameId
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameId
    var gasVisualizationType = visualizationType + "_" + gasNameId 
    var htmlCanvas ='<div class="row" style="margin-top: 15px;" id="' + rowIdGasVisualization + '">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div>' +
                                    '<h6 class="mb-0" style="float:left">' + gasName + '</h6>' +
                                    selIntervalHtml + 
                                    selPointsHtml + 
                                '</div>' +
                                getMovingButtonsHtml(gasNameId, visualizationType) + 
                                '<canvas id="' + gasVisualizationType + '"></canvas>' +
                            '</div>' +
                        '</div>'
                    '</div>'
    return htmlCanvas
}
// rendering the visualization for the current time interval 
function renderVisualizationPointsOnGraph(canvasId, gasName, visualizedInterval, visualizedData) {
    // getting the ID for the canvas and applying the data 
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
        if(currIdGasVisualization == rowIdGasVisualization) {
            $("#" + currIdGasVisualization).show()
            continue
        }
        $("#" + currIdGasVisualization).hide()
    }
}
// iteration for rendering the selected filtered substances
function loadDashboardData() {
    console.log('starting loading dashboard data')
    var gasTest = {"gasId": 3, "gasName": "CH4"}
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
                if(data['status'].startsWith("ok_") == false) {
                    console.log("nothing to display")
                    return 
                }
                // preparation of the canvas for the current substance 
                var gasNameId = data['gasName'] + "_" + data['gasId']
                // getting data for default visualization
                console.log(data)
                var dataDisplayMMM = getDataToDisplayMMM(data)
                console.log(dataDisplayMMM)
                var dataDisplayS = getDataToDisplaySS(data)
                console.log(dataDisplayS)
                var dataDisplayM = getDataToDisplayMM(data)
                console.log(dataDisplayM)
                var dataDisplayH = getDataToDisplayHH(data)
                console.log(dataDisplayH)
                // no data to display for the basic case 
                if(dataDisplayMMM['data'].length == 0) {
                    console.log("nothing to display")
                    return 
                }
                // creation of time intervals object 
                var currIntervalNumValues = {}
                currIntervalNumValues["mmm_" + gasNameId] = dataDisplayMMM 
                currIntervalNumValues["ss_" + gasNameId] = dataDisplayS
                currIntervalNumValues["mm_" + gasNameId] = dataDisplayM 
                currIntervalNumValues["hh_" + gasNameId] = dataDisplayH
                allTimeDivisionPoints["mmm_" + gasNameId] = dataDisplayMMM 
                allTimeDivisionPoints["ss_" + gasNameId] = dataDisplayS
                allTimeDivisionPoints["mm_" + gasNameId] = dataDisplayM 
                allTimeDivisionPoints["hh_" + gasNameId] = dataDisplayH
                // creation of the overall visualization of interval (valid for all the selections)
                var selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "mmm", currIntervalNumValues)
                // creation for the visualization of mmm points 
                var selPointsHtml = decidePointsIntervalSelection(gasNameId, "mmm", currIntervalNumValues["mmm_" + gasNameId]["data"].length)
                var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "mmm", selIntervalsHtml, selPointsHtml)
                $('#dashboardContent').append(htmlCanvasAppend)
                var currChartMMM = renderVisualizationPointsOnGraph("mmm_" + gasNameId, data['gasName'], dataDisplayMMM['labels'], dataDisplayMMM['data'])
                allChartsRefs["mmm_" + gasNameId] = currChartMMM
                // creation of the visualization for the ss points 
                if(currIntervalNumValues["ss_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "ss", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "ss", currIntervalNumValues["ss_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "ss", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    var curChartSS = renderVisualizationPointsOnGraph("ss_" + gasNameId, data['gasName'], dataDisplayS['labels'], dataDisplayS['data'])
                    allChartsRefs["ss_" + gasNameId] = curChartSS
                }
                // creation of the visualization for the mm points 
                if(currIntervalNumValues["mm_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "mm", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "mm", currIntervalNumValues["mm_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "mm", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    var currChartMM = renderVisualizationPointsOnGraph("mm_" + gasNameId, data['gasName'], dataDisplayM['labels'], dataDisplayM['data'])
                    allChartsRefs["mm_" + gasNameId] = currChartMM
                }
                // creation of the visualization for the hh points 
                if(currIntervalNumValues["hh_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "hh", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "hh", currIntervalNumValues["hh_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "hh", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    var currChartHH = renderVisualizationPointsOnGraph("hh_" + gasNameId, data['gasName'], dataDisplayH['labels'], dataDisplayH['data'])
                    allChartsRefs["hh_" + gasNameId] = currChartHH
                }
                // default selections for current graph curve 
                makeDefaultSelectionTimeCurve(gasNameId, "mmm", "all", currIntervalNumValues)
            },
            error: function(err) {
                alert('During saving filters an error occur')
                console.log('error saving filters\n' + err)
            }
          });
    }
}
