// global variables of all the data to manage 
var allTimeDivisionPoints = {}
var setCanvasPoints = []
var allChartsRefs = {}
var allSessionsId = {}

// eventual deactivation of the arrow movement on visualized set 
function checkArrowMovementsConsistency(currVisualizedSet, currOverallSet, gasNameId, visualizationType) {
    
}
// moving backward on rendered graph
function moveBackward(arrId) {

}
// moving forward on rendered graph
function moveForward(arrId) {
    
}

// second versione for the rendering the selected filtered substances 
// this second version render all the points in a unique post call and for all the substances 
function loadDashboardData() {
    // initializing dashboard parameters 
    allTimeDivisionPoints = {};
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
            
                allCanvasPoints.push({ "canvasId": gasNameSessionId, "gasNameSession": gasNameSessionId, "currSet": currGasObj.gasData });
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
            console.log(renderedCarouselsObjects);
            console.log(allCanvasPoints);
        },
        error: function(err) {
            console.log('error saving filters\n' + err);
        }
      });
}