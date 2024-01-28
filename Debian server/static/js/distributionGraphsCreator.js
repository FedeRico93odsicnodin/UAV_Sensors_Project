// global variables of all the data to manage 
var allTimeDivisionPoints = {}

// eventual deactivation of the arrow movement on visualized set 
function checkArrowMovementsConsistency(currVisualizedSet, currOverallSet, gasNameId, visualizationType) {
    
}
// moving backward on rendered graph
function moveBackward(arrId) {

}
// moving forward on rendered graph
function moveForward(arrId) {
    
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
    // console.log(currColorApplication);
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
}
// second versione for the rendering the selected filtered substances 
// this second version render all the points in a unique post call and for all the substances 
function loadDashboardData() {
    // initializing dashboard parameters 
    allCanvasPoints = [];
    allChartsRefs = {};
    allSessionsId = {};
    var gasNameSessionIds = [];
    // variable for all displayed chart of the carousel 
    var allDisplayedChartSessions = [];
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
                allDisplayedChartSessions.push(currGraphHtmlRef)
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