// global variables of all the data to manage 
var allTimeDivisionPoints = {}
// current visualized graph charts 
var allVisualizedChartsPointers = {};
// new interval selection for the current substance 
function setNewIntervalGraphNew(invokerGasBlock) {
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
            $("#" + selectorPointsId).show();
            var selectorPointsHtml = document.getElementById(selectorPointsId);
            var replacePointsSelectionHtml = getCurrentSelectorTimePointsHtml(currGasCanvasId, currDataLen);
            selectorPointsHtml.innerHTML = replacePointsSelectionHtml;

        }
        });
       
}
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
                // console.log(currGasObj);
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

                gasNameSessionIds.push(gasNameSessionId);

                // getting the html for the current graph
                var currGraphHtmlRef = createBodyGraphsCurrSession(currGasObj, gasNameSessionId);
                allCanvasPoints.push({ 
                    "canvasId": gasNameSessionId, 
                    "gasNameSession": gasNameSessionId, 
                    "currSet": currGasObj.gasData, 
                    "gasName": gasName,
                    "gasNameId": gasNameId });
                    
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
            }
        },
        error: function(err) {
            console.log('error saving filters\n' + err);
        }
      });
}