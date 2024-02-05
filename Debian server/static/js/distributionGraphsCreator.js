// global variables of all the data to manage 
var allTimeDivisionPoints = {}
// current visualized graph charts 
var allVisualizedChartsPointers = {};

///////////////////////// INTERVAL AND NUMBER OF POINTS SELECTIONS ///////////////////////// 
// new interval selection for the current substance 
function setNewIntervalGraph(invokerGasBlock) {
    // getting the gas attributes from the invokerId 
    var invokerId = invokerGasBlock.id;
    var vis_granularity = invokerGasBlock.value;
    var gasObj = getGasParametersFromIntervalSelectorId(invokerId);
    // modification of the object with the current interval 
    gasObj.vis_granularity = vis_granularity;
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
            // getting the basic elements for the new visualization 
            var gasName = gasObj.gasName;
            var visualizedInterval = data.labels;
            var visualizedData = data.data;
            // creating the current ID for the canvas to select 
            var currGasNameIdRef = gasName + "_" + gasObj.gasId;
            var currGasCanvasId = gasName + "_" + gasObj.gasId + "_session" + gasObj.sessionId;
            // emptying the content for the selected canvas
            var currChart = allVisualizedChartsPointers[currGasCanvasId];
            currChart.destroy();
            // getting the color for the graph to ricreate
            var currColorApplication = "rgba(" + StoredGasColors[currGasNameIdRef].color + ", .45)";
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
            
            // getting the selection point html
            var selectorPointsId = getIdCurrentSelectorPoints(currGasCanvasId);
            // data less than 5 points: just hide the selector of points bar 
            if(currDataLen < 5) {
                $("#" + selectorPointsId).hide();
                return;
            }
            var selectorPointsHtml = document.getElementById(selectorPointsId);
            var replacePointsSelectionHtml = getCurrentSelectorTimePointsHtml(currDataLen);
            selectorPointsHtml.innerHTML = replacePointsSelectionHtml;
            $("#" + selectorPointsId).show();

            // setting the default selection for the current visualization 
            // TODO: implementation for obtaining the SAME OBJECT as the one of the first load calls 
            // so as to have the vis type for the set visualization type 
        }
        });
       
}
// new num of points selection for the current substance
function setNewNumPointsGraph(invokerGasBlock) {
    console.log(invokerGasBlock);
    // TODO: implementation with new points selections
}
////////////////////////////////////////////////////////////////////////////////////////////


// eventual deactivation of the arrow movement on visualized set 
function checkArrowMovementsConsistency(currVisualizedSet, currOverallSet, gasNameId, visualizationType) {
    console.log('arrow');
}
// moving backward on rendered graph
function moveBackward(arrObject) {
    getDesiredPointsFromArrowSelector(arrObject);
}
// moving forward on rendered graph
function moveForward(arrObject) {
    getDesiredPointsFromArrowSelector(arrObject);
}
// common function for the arrow movements: retrieving the desired points to enqueue depending on the verse
function getDesiredPointsFromArrowSelector(arrObject) {
    // getting current arrow id 
    var currArrId = arrObject.id;
    // getting the definition of the object for the selected gas and session 
    var gasObj = getGasParametersFromIntervalSelectorId(currArrId);

    console.log(gasObj);

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
                    "vis_type": gasVisType});
                    
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
            }
        },
        error: function(err) {
            console.log('error saving filters\n' + err);
        }
      });
}