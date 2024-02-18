// global variables of all the data to manage 
var allTimeDivisionPoints = {}
// current visualized graph charts 
var allVisualizedChartsPointers = {};
// set of the objects defining the extreme points date of visualization 
var extremesVisualizationMonitor = {};
///////////////////////// INTERVAL AND NUMBER OF POINTS SELECTIONS ///////////////////////// 
// new interval selection for the current substance 
function setNewIntervalGraph(invokerGasBlock) {
    // getting the gas attributes from the invokerId 
    var invokerId = invokerGasBlock.id;
    var vis_granularity = invokerGasBlock.value;
    var gasObj = getGasParametersFromIntervalSelectorId(invokerId);
    // modification of the object with the current interval 
    gasObj.vis_granularity = vis_granularity;
    // selection of the current vis_type to apply to the gas 
    // getting the basic elements for the new visualization 
    var gasId = gasObj.gasId;
    var gasName = gasObj.gasName;
    var sessionId = gasObj.sessionId;
    var currGasCanvasId = getGasNameSessionId(gasId, gasName, sessionId);
    // getting the selection for the number of points selection
    visTypeCurrCaseNumValue = getVisTypeCurrSubstance(currGasCanvasId);
    gasObj.vis_type = visTypeCurrCaseNumValue;
    var gasObjJSON = JSON.stringify(gasObj);
    
    // making the POST for getting the new points set visualization 
    $.ajax({
        type: "POST",
        url: "/gas_load_specific_gas",
        contentType: "application/json",
        dataType: 'json',
        data: gasObjJSON,
        success: function(data) 
        { 
            // pointer to the current gas reference 
            var gasNameSessionId = gasName + "_" + sessionId;
            // getting the current elements di display
            var visualizedInterval = data[gasNameSessionId].gasData.labels;
            var visualizedData = data[gasNameSessionId].gasData.data;
            // getting the overall number of points for selected substance
            var overallNumPoints = data[gasNameSessionId].gasData.lenInd;
            // getting the vis_type 
            var vis_type = data[gasNameSessionId].vis_type;
            // creating the current ID for the canvas to select 
            var currGasNameIdRef = gasName + "_" + gasId;
            // getting the real dates for the visualized set 
            var realDatesVisualization = data[gasNameSessionId].gasData.realdates;
            // emptying the content for the selected canvas
            var currChart = allVisualizedChartsPointers[currGasCanvasId];
            currChart.destroy();
            // creating the new charts with the new set of retrieved points
            // NB: the new selector for the canvas will be replaced to memory objects
            renderVisualizationPointsOnGraph(
                currGasCanvasId
                , gasName
                , currGasNameIdRef
                , visualizedInterval
                , visualizedData);

            // recalculating the current possible selections of the points 
            // getting the new number of elements for the selection 
            var currDataLen = visualizedInterval.length;
            var visTypeCurrCaseSelector = getIdCurrentSelectorPoints(currGasCanvasId);
            // data less than 5 points: just hide the selector of points bar 
            if(currDataLen < 5) {
                $("#" + visTypeCurrCaseSelector).hide();
                return;
            }
            var selectorPointsHtml = document.getElementById(visTypeCurrCaseSelector);
            var replacePointsSelectionHtml = getCurrentSelectorTimePointsHtml(overallNumPoints);
            selectorPointsHtml.innerHTML = replacePointsSelectionHtml;
            $("#" + visTypeCurrCaseSelector).show();

            // setting the selection for the interval 
            setNumOfPointsVisualizationSelection(currGasCanvasId, vis_type);
            // deciding if visualize or not the arrow movements 
            decideGasMovementBarVisualization(currGasCanvasId, visTypeCurrCaseNumValue, overallNumPoints);
            // setting again the array of the current visualized real dates 
            setMinMaxVisualizedDatesPointsForSubstance(currGasCanvasId, realDatesVisualization);
        }
        });
       
}
// new num of points selection for the current substance
function setNewNumPointsGraph(invokerGasBlock) {
    // getting the references for the current gas 
    var invokerId = invokerGasBlock.id;
    var vis_typeNum = -1;
    var vis_type = invokerGasBlock.value;
    if(vis_type != 'all') {
        vis_typeNum = parseInt(vis_type);
    }
    var gasObj = getGasParametersFromIntervalSelectorId(invokerId);
    // valorization for the current vis_type to select 
    gasObj.vis_type = vis_typeNum;
    // retrieving the gas base parameters for the POST and the selection 
    var gasId = gasObj.gasId;
    var gasName = gasObj.gasName;
    var sessionId = gasObj.sessionId;
    var currGasCanvasId = getGasNameSessionId(gasId, gasName, sessionId);
    // getting the current visualization parameters for the granularity 
    visGranularityCurrCaseValue = getVisGranularityCurrSubstance(currGasCanvasId);
    gasObj.vis_granularity = visGranularityCurrCaseValue;
    var gasObjJSON = JSON.stringify(gasObj);
    // making the POST for getting the new points set visualization 
    $.ajax({
        type: "POST",
        url: "/gas_load_specific_gas",
        contentType: "application/json",
        dataType: 'json',
        data: gasObjJSON,
        success: function(data) 
        { 
            // pointer to the current gas reference 
            var gasNameSessionId = gasName + "_" + sessionId;
            // getting the current elements di display
            var visualizedInterval = data[gasNameSessionId].gasData.labels;
            var visualizedData = data[gasNameSessionId].gasData.data;
            // getting the overall number of points for selected substance
            var overallNumPoints = data[gasNameSessionId].gasData.lenInd;
            // getting the vis_type 
            var vis_type = data[gasNameSessionId].vis_type;
            // creating the current ID for the canvas to select 
            var currGasNameIdRef = gasName + "_" + gasId;
            // getting the real dates for the visualized set 
            var realDatesVisualization = data[gasNameSessionId].gasData.realdates;
            // emptying the content for the selected canvas
            var currChart = allVisualizedChartsPointers[currGasCanvasId];
            currChart.destroy();
            // creating the new charts with the new set of retrieved points
            // NB: the new selector for the canvas will be replaced to memory objects
            renderVisualizationPointsOnGraph(
                currGasCanvasId
                , gasName
                , currGasNameIdRef
                , visualizedInterval
                , visualizedData);
            // deciding whether activate or not the arrow movement visualization 
            decideGasMovementBarVisualization(currGasCanvasId, vis_typeNum, overallNumPoints);
            // setting again the array of the current visualized real dates 
            setMinMaxVisualizedDatesPointsForSubstance(currGasCanvasId, realDatesVisualization);
        }
        });
}
////////////////////////////////////////////////////////////////////////////////////////////


// eventual deactivation of the arrow movement on visualized set 
function checkArrowMovementsConsistency(currVisualizedSet, currOverallSet, gasNameId, visualizationType) {
    console.log('arrow');
}
// moving backward on rendered graph
function moveBackward(arrObject) {
    // getting the gas object for the current request 
    var gasObjRequest = getDesiredPointsFromArrowSelector(arrObject, false);
    // string of the gas object request 
    var gasObjRequestJSON = JSON.stringify(gasObjRequest);
    // making the POST request for getting the set of the points to include to current graph
    $.ajax({
        type: "POST",
        url: "/gas_load_movement_curve",
        contentType: "application/json",
        dataType: 'json',
        data: gasObjRequestJSON,
        success: function(data) 
        { 
             // action taken with the movement backward
             moveActionPostMovement(gasObjRequest, data, 'backward');
        }
        });
}
// moving forward on rendered graph
function moveForward(arrObject) {
    // getting the gas object for the current request 
    var gasObjRequest = getDesiredPointsFromArrowSelector(arrObject, true);
    // string of the gas object request 
    var gasObjRequestJSON = JSON.stringify(gasObjRequest);
    // making the POST request for getting the set of the points to include to current graph
    $.ajax({
        type: "POST",
        url: "/gas_load_movement_curve",
        contentType: "application/json",
        dataType: 'json',
        data: gasObjRequestJSON,
        success: function(data) 
        { 
            // action taken with the movement forward
            moveActionPostMovement(gasObjRequest, data, 'forward');
        }
        });
}
// move forward or backward post action 
function moveActionPostMovement(gasObjRequest, newPointsData, moveDirection) {
    // retrieving the necessary elements 
    var gasName = gasObjRequest.gasName;
    var gasId = gasObjRequest.gasId;
    var sessionId = gasObjRequest.sessionId;
    var moveStepPoints = gasObjRequest.pointsOfMovement;
    var gasNameSessionId = getGasNameSessionId(gasId, gasName, sessionId);
    var newPointValues = newPointsData.data;
    var newPointLabels = newPointsData.labels;
    var realDates = newPointsData.realdates;
    // no more points to show 
    if(newPointLabels.length == 0) {
        return;
    }
    // retrieving the curr graph reference 
    var currGraphReference = allVisualizedChartsPointers[gasNameSessionId];
    // updating the elements for the current graph 
    // action on curve if the movement is forward
    var lastPointerIndexLabels = currGraphReference.data.labels.length - 1;
    // getting the array of visualized dates 
    var newArrayVisualizedDates = extremesVisualizationMonitor[gasNameSessionId].currDates;
    if(moveDirection == 'forward') {
        currGraphReference.data.labels = currGraphReference.data.labels.slice(moveStepPoints);
        currGraphReference.data.datasets[0].data = currGraphReference.data.datasets[0].data.slice(moveStepPoints);
        currGraphReference.data.labels = currGraphReference.data.labels.concat(newPointLabels);
        currGraphReference.data.datasets[0].data = currGraphReference.data.datasets[0].data.concat(newPointValues);
        currGraphReference.update();
        // updating the array for the real values of the dates
        newArrayVisualizedDates = newArrayVisualizedDates.slice(moveStepPoints);
        newArrayVisualizedDates = newArrayVisualizedDates.concat(realDates);
    }
    // action on curve if the movement is backward
    else {
        currGraphReference.data.labels = currGraphReference.data.labels.slice(0, lastPointerIndexLabels);
        console.log(currGraphReference.data.labels);
        currGraphReference.data.datasets[0].data = currGraphReference.data.datasets[0].data.slice(0, lastPointerIndexLabels);
        currGraphReference.data.labels = newPointLabels.concat(currGraphReference.data.labels);
        console.log(currGraphReference.data.labels);
        currGraphReference.data.datasets[0].data = newPointValues.concat(currGraphReference.data.datasets[0].data);
        currGraphReference.update();
        // updating the array for teh real values of the dates 
        newArrayVisualizedDates = newArrayVisualizedDates.slice(0, lastPointerIndexLabels);
        newArrayVisualizedDates = realDates.concat(newArrayVisualizedDates);
    }
    // updating the object with the new extreme values
    setMinMaxVisualizedDatesPointsForSubstance(gasNameSessionId, newArrayVisualizedDates);
}
// common function for the arrow movements: retrieving the desired points to enqueue depending on the verse
function getDesiredPointsFromArrowSelector(arrObject, isMovingForward) {
    // getting current arrow id 
    var currArrId = arrObject.id;
    // getting the definition of the object for the selected gas and session 
    var gasObj = getGasParametersFromIntervalSelectorId(currArrId);
    // getting the curr gasNameSessionId
    var gasName = gasObj.gasName; 
    var gasId = gasObj.gasId;
    var sessionId = gasObj.sessionId;
    var gasNameSessionId = getGasNameSessionId(gasId, gasName, sessionId);
    // getting the visualization type for the current substance 
    var currVisType = getVisTypeCurrSubstance(gasNameSessionId);
    gasObj.vis_type = currVisType;
    // getting the visualization granularity for the current substance 
    var currVisGranularity = getVisGranularityCurrSubstance(gasNameSessionId);
    gasObj.vis_granularity = currVisGranularity;
    // getting the extremes for the object depending on the sense of movement 
    if(isMovingForward) {
        // getting the max extreme for the current visualization 
        var extremsVisMonitorLastPos = extremesVisualizationMonitor[gasNameSessionId].currDates.length -1;
        var currMaxVisualizedDate = extremesVisualizationMonitor[gasNameSessionId].currDates[extremsVisMonitorLastPos];
        // getting the willing new point to insert in the graph 
        var moveForwardIdContentValue = getMoveForwardValueId(gasNameSessionId);
        var arrowMovementPointsVal = document.getElementById(moveForwardIdContentValue).value;
        var arrowMovementPointsInt = parseInt(arrowMovementPointsVal);
        // setting the value for the getting the points to add 
        gasObj.direction = 'forward';
        gasObj.extremeInterval = currMaxVisualizedDate;
        gasObj.pointsOfMovement = arrowMovementPointsInt;
    }
    else {
        // getting the min extreme for the current visualization 
        var currMinVisualizedDate = extremesVisualizationMonitor[gasNameSessionId].currDates[0];
        // getting the willing new point to insert in the graph 
        var moveBackwardIdContentValue = getMoveBackwardValueId(gasNameSessionId);
        var arrowMovementPointsVal = document.getElementById(moveBackwardIdContentValue).value;
        var arrowMovementPointsInt = parseInt(arrowMovementPointsVal);
        // setting the value for the getting the points to add 
        gasObj.direction = 'backward';
        gasObj.extremeInterval = currMinVisualizedDate;
        gasObj.pointsOfMovement = arrowMovementPointsInt;
    }
    return gasObj;

}
// getting the current value for the vis_type
function getVisTypeCurrSubstance(gasNameSessionId) {
    var visTypeCurrCaseSelector = getIdCurrentSelectorPoints(gasNameSessionId);
    var visTypeCurrCaseSelValue = document.getElementById(visTypeCurrCaseSelector).value;
    var visTypeCurrCaseNumValue = -1;
    if(visTypeCurrCaseSelValue != 'all') {
        visTypeCurrCaseNumValue = parseInt(visTypeCurrCaseSelValue);
    }
    return visTypeCurrCaseNumValue;
}
// getting the current value for the vis_granularity
function getVisGranularityCurrSubstance(gasNameSessionId) {
    var visGranularityCurrCaseSelection = getIdCurrentSelectorIntervals(gasNameSessionId);
    var visGranularityCurrCaseValue = document.getElementById(visGranularityCurrCaseSelection).value;
    return visGranularityCurrCaseValue
} 
// setting the dates for the min and max points of visualization and for making a new eventual selection on arrows
function setMinMaxVisualizedDatesPointsForSubstance(gasNameSessionId, visualizedDates) {
    // creation of the object for keeping track of the range of selection 
    var dateVisualizationObj = {
        "currDates" : visualizedDates,
        "gasNameSessionId": gasNameSessionId
    };
    // memorizing the current object for the extremes of visualization 
    extremesVisualizationMonitor[gasNameSessionId] = dateVisualizationObj;
}
// rendering the visualization for the current time interval 
function renderVisualizationPointsOnGraph(
    canvasId, 
    gasName, 
    gasNameIdRef,
    visualizedInterval, 
    visualizedData
    ) {
    var currColorApplication = "rgba(" + StoredGasColors[gasNameIdRef].color + ", .45)";
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
                    backgroundColor: currColorApplication,
                    fill: true
                }
            ]
            },
        options: {
            responsive: true
        }
    });
    // storing the visualization for the current graph 
    allVisualizedChartsPointers[canvasId] = lineChart;
}
// enabling or disabling the gas movement bar basing on situation 
function decideGasMovementBarVisualization(gasNameSessionId, currVisType, overallNumPoints) {
    // getting the ID for the current bar
    var gasMenuMovementBarId = getMoveBtnsMenuId(gasNameSessionId);
    // if the current visualization type = -1 means that all the points are selected and the arrows movements should be disabled
    if(currVisType == -1) {
        $("#" + gasMenuMovementBarId).hide();
        return;
    }
    // if the selection of the type (the number of visualized points) are bigger or equal 
    // to the overall number of points for the visualization, the bar should be disabled
    if(currVisType >= overallNumPoints) {
        $("#" + gasMenuMovementBarId).hide();
        return;
    }
    // for every other case the bar is enabled
    $("#" + gasMenuMovementBarId).show();
}
// selection for the number of points visualization 
function setNumOfPointsVisualizationSelection(gasNameSessionId, currVisType) {
    // getting the current id for the number of points visualization
    var selPointsInterval = getIdCurrentSelectorPoints(gasNameSessionId);
    // case in which all the points are visualized for the current interval
    if(currVisType == -1) {
        document.getElementById(selPointsInterval).value = "all";
        return;
    }
    // for the other cases the number of points selected is inserted as value 
    document.getElementById(selPointsInterval).value = currVisType;
}
// second versione for the rendering the selected filtered substances 
// this second version render all the points in a unique post call and for all the substances 
function loadDashboardData() {
    // initializing dashboard parameters 
    var allCanvasPoints = [];
    // keeping track of the current order for the elements in the array 
    var gasNameIdOrder = {};
    var gasNameSessionIds = [];
    // variable for all displayed chart of the carousel 
    var allDisplayedChartSessions = [];
    // resetting content for the previous html
    document.getElementById("dashboardContent").innerHTML = "";
    // making the call for returning the points 
    $.ajax({
        type: "POST",
        url: "/gasdata_load_new",
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
            for(var gasToLoad in data) {
                var currGasObj = data[gasToLoad];
                
                if(currGasObj['status'].startsWith("ok_") == false) {
                    // console.log("nothing to display")
                    return 
                }
                // no data to display 
                if(currGasObj['gasData'].length == 0) {
                    // console.log("nothing to display")
                    return 
                }
                setCanvasPoints = [];
                // gas identification ids
                var gasName = currGasObj['gasName'];
                var gasNameId = currGasObj['gasName'] + "_" + currGasObj['gasId'];
                var currGasParts = gasToLoad.split("_");
                var sessionId = currGasParts[1];
                var gasNameSessionId = gasNameId + '_session' + sessionId;
                var gasVisType = currGasObj["vis_type"];

                gasNameSessionIds.push(gasNameSessionId);

                // getting the html for the current graph
                var currGraphHtmlRef = createBodyGraphsCurrSession(currGasObj, gasNameSessionId);
                allCanvasPoints.push({ 
                    "canvasId": gasNameSessionId, 
                    "gasNameSession": gasNameSessionId, 
                    "currSet": currGasObj.gasData, 
                    "gasName": gasName,
                    "gasNameId": gasNameId,
                    "vis_type": gasVisType
                });
                    
                // verifyng the push order for the substance 
                if(!gasNameIdOrder.hasOwnProperty(gasNameId)) {
                    allDisplayedChartSessions.push(currGraphHtmlRef);
                    gasNameIdOrder[gasNameId] = currGraphHtmlRef;
                    continue;
                }
                var lastPushedHtml = gasNameIdOrder[gasNameId];
                var lastHtmlIndex = allDisplayedChartSessions.indexOf(lastPushedHtml);
                if(lastHtmlIndex == allDisplayedChartSessions.length - 1) {
                    allDisplayedChartSessions.push(currGraphHtmlRef);
                    gasNameIdOrder[gasNameId] = currGraphHtmlRef;
                    continue;
                }
                lastHtmlIndex = lastHtmlIndex + 1;
                allDisplayedChartSessions.splice(lastHtmlIndex, 0, currGraphHtmlRef);
                gasNameIdOrder[gasNameId] = currGraphHtmlRef;
            }
            // preparation of all the carousels for displaying the different sessions 
            renderedCarouselsObjects = prepareCarouselHtml(allDisplayedChartSessions);
            
            for(var gasNameId in renderedCarouselsObjects) {
                // init session carousel 
                var gasCarouselId = 'gasCarousel_' + gasNameId;
                // creating and appending the overall carousel
                var carouselHtml = getCarouselMainHtml(renderedCarouselsObjects[gasNameId], gasCarouselId);
                // appending the current carousel block to the main dashboard content 
                $('#dashboardContent').append(carouselHtml);
                $('#' + gasCarouselId).carousel({
                    interval: false
                  });
            }
            for(var indCanvas in allCanvasPoints) {
                // getting all the elements for the canvas initialization 
                var canvasId = allCanvasPoints[indCanvas].canvasId;
                var gasName = allCanvasPoints[indCanvas].gasName;
                var gasNameId = allCanvasPoints[indCanvas].gasNameId;
                var visualizedInterval = allCanvasPoints[indCanvas].currSet.labels;
                var visualizedData = allCanvasPoints[indCanvas].currSet.data;
                // getting the visualized extremes for the current visualization 
                var lastIndexDate = allCanvasPoints[indCanvas].currSet.realdates.length - 1;
                var realDatesRef = allCanvasPoints[indCanvas].currSet.realdates;
                
                // rendering for the current gas canvas 
                renderVisualizationPointsOnGraph(
                    canvasId, 
                    gasName, 
                    gasNameId, 
                    visualizedInterval, 
                    visualizedData);
                // the overall number of points for the current visualization 
                var overallNumPoints = allCanvasPoints[indCanvas].currSet.lenInd;
                // the range visualization points 
                var currVisualizedType = allCanvasPoints[indCanvas].vis_type;
                // deciding if enabling or disabling the arrow movements based on the parameters
                decideGasMovementBarVisualization(canvasId, currVisualizedType, overallNumPoints);
                // set the first visualization for the number of points displayed bar 
                setNumOfPointsVisualizationSelection(canvasId, currVisualizedType);
                // setting the extremes of the inverval for the current substance visualization 
                setMinMaxVisualizedDatesPointsForSubstance(canvasId, realDatesRef);
            }
        },
        error: function(err) {
            console.log('error saving filters\n' + err);
        }
      });
}