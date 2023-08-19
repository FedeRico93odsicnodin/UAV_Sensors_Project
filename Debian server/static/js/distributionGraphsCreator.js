// global variables of all the data to manage 
var allTimeDivisionPoints = {}
var allChartsRefs = {}
// getting the gasNameId from the selector id 
function getGasNameIdFromSelectorId(selId) {
    var currIdParts = selId.split("_")
    var gasNameId = currIdParts[2] + "_" + currIdParts[3]
    return gasNameId
}
function getCurrTimeRangeFromSelectorId(selId) {
    var currIdParts = selId.split("_")
    var currTimeSel = currIdParts[1]
    return currTimeSel
}
function getCurrTimeFromCurrGasSelectionId(selId) {
    var currIdParts = selId.split("_")
    var currTimeSel = currIdParts[0]
    return currTimeSel
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
    var gasVisualizationType = gasNameId + "_" + timeRange

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
    console.log(arrId)
}
function moveForward(arrId) {
    console.log(arrId)
}
// moving buttons through iterated points 
function getMovingButtonsHtml(gasNameId, visualizationType) {
    var gasNameIdMoveBtnsMenuId = "moveButtons_" + visualizationType + "_" + gasNameId
    var renderHtml = '<div style="margin-top:35px" id="' + gasNameIdMoveBtnsMenuId + '">' + 
    '<span onclick="moveBackward(this)" class="bi bi-arrow-left-circle" style="float:left;font-size: 1.5rem;"></span>' + 
    '<input type="text" style="width:35px;height:20px;float:left;margin-left:7.5px;margin-top:8.5px" id="usr" value="1"></input>'+
    
    '<span onclick="moveForward(this)" class="bi bi-arrow-right-circle" style="float:right;font-size: 1.5rem;"></span>' + 
    '<input type="text" style="width:35px;height:20px;float:right;margin-right:7.5px;margin-top:8.5px" id="usr" value="1"></input>'+
    '</div>'
    return renderHtml
}
// html for rendering single canvas gas visualizer
function createGasCanvas(gasName, gasNameId, visualizationType, selIntervalHtml, selPointsHtml) {
    // rendered html 
    var rowIdGasVisualization = visualizationType + "_" + gasNameId + "_row"
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameId
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameId
    var gasVisualizationType = gasNameId + "_" + visualizationType
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
                var canvasID = gasNameId + "_mmm"
                var currChartMMM = renderVisualizationPointsOnGraph(canvasID, data['gasName'], dataDisplayMMM['labels'], dataDisplayMMM['data'])
                // creation of the visualization for the ss points 
                if(currIntervalNumValues["ss_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "ss", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "ss", currIntervalNumValues["ss_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "ss", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    canvasID = gasNameId + "_ss"
                    renderVisualizationPointsOnGraph(canvasID, data['gasName'], dataDisplayS['labels'], dataDisplayS['data'])
                }
                // creation of the visualization for the mm points 
                if(currIntervalNumValues["mm_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "mm", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "mm", currIntervalNumValues["mm_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "mm", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    canvasID = gasNameId + "_mm"
                    renderVisualizationPointsOnGraph(canvasID, data['gasName'], dataDisplayM['labels'], dataDisplayM['data'])
                }
                // creation of the visualization for the hh points 
                if(currIntervalNumValues["hh_" + gasNameId]["data"].length > 0) {
                    selIntervalsHtml = decideTimeIntervalSelection(gasNameId, "hh", currIntervalNumValues)
                    selPointsHtml = decidePointsIntervalSelection(gasNameId, "hh", currIntervalNumValues["hh_" + gasNameId]["data"].length)
                    var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId, "hh", selIntervalsHtml, selPointsHtml)
                    $('#dashboardContent').append(htmlCanvasAppend)
                    canvasID = gasNameId + "_hh"
                    renderVisualizationPointsOnGraph(canvasID, data['gasName'], dataDisplayH['labels'], dataDisplayH['data'])
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
