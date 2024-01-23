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
    allCanvasPoints = {};
    allChartsRefs = {};
    allSessionsId = {};
    var gasNameSessionIds = [];
    // variable for all displayed chart of the carousel 
    var allDisplayedChartSessions = {};
    // making the call for returning the points 
    $.ajax({
        type: "POST",
        url: "/gasdata_load_new",
        contentType: "application/json",
        dataType: 'json',
        success: function(data) {
            for(var gasToLoad in data) {
                var currGasObj = data[gasToLoad];
                console.log(currGasObj);
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
                var currGraphHtml = createBodyGraphsCurrSession(currGasObj, gasNameSessionId);
             
                if(gasNameId in allDisplayedChartSessions) {
                    allDisplayedChartSessions[gasNameId].push(currGraphHtml);
                    allCanvasPoints[gasNameId].push({ "canvasId": gasNameSessionId, "gasName": gasName, "currSet": currGasObj.gasData });
                    continue;
                }
                // first graph to visualize for the current gas
                allDisplayedChartSessions[gasNameId] = [];
                allDisplayedChartSessions[gasNameId].push(currGraphHtml);
                allCanvasPoints[gasNameId] = [];
                allCanvasPoints[gasNameId].push({ "canvasId": gasNameSessionId, "gasName": gasName, "currSet": currGasObj.gasData });
            }
            console.log(allDisplayedChartSessions);
        },
        error: function(err) {
            console.log('error saving filters\n' + err);
        }
      });
}