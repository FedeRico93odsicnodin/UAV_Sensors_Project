/*
    Here it is placed all the dynamic html for the graph rendering 
    (done in the distributionGraphsCreator script)
*/
// new function for visualizing the current substances 
function createBodyGraphsCurrSession(data, gasNameSessionId) {
    // getting the HTML for the selection of the type of visualization 
    var setIntervalsHtml = decideTimeIntervalSelection(gasNameSessionId);
    // getting the HTML for the current presentation points 
    var selPointsHtml = decidePointsIntervalSelection(gasNameSessionId, data.gasData.lenInd);
    // creation of the HTML for the current container of visualization
    var gasName = data.gasName;
    var gasSessionName = data.gasData.sessionName;
    var visType = data.vis_granularity;
    var currVisualizationContainer = createGasCanvas(
        gasName, 
        gasSessionName, 
        gasNameSessionId,
        visType,
        setIntervalsHtml,
        selPointsHtml
        );
    return currVisualizationContainer;
}
// deciding how many selections for time visualizations add to curve (new version)
function decideTimeIntervalSelection(gasNameSessionId) {
    var selTimeInterval = 'intervalDashboardSel_' + gasNameSessionId;
    // enabling all the possible visualization granularity: at least one point for each of the selection is possible to visualize 
    var selStartHtml = '<select class="select" style="float:right" id="' + selTimeInterval + '" onchange="setNewIntervalGraphNew(this);">'
    + '<option value="mmm">mmm</option>'
    + '<option value="ss">ss</option>'
    + '<option value="mm">mm</option>'
    + '<option value="hh">hh</option>'
    + '</select>';
    return selStartHtml;
}
// deciding how many selections for points to display on curve (new version)
function decidePointsIntervalSelection(gasNameSessionId, currVisualizationNum) {
    // if num of points less than 5 the menu will not be created 
    if(currVisualizationNum < 5) {
        return ''
    }
    var selPointsInterval = 'pointsIntervalSel_' + gasNameSessionId;
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
// html for rendering single canvas gas visualizer (new implementation)
function createGasCanvas(gasName, gasSession, gasNameSessionId, visualizationType, selIntervalHtml, selPointsHtml) {
    // rendered html 
    var rowIdGasVisualization = visualizationType + "_" + gasNameSessionId + "_row";
    var selTimeInterval = 'intervalDashboardSel_' + visualizationType + "_" + gasNameSessionId;
    var selPointsInterval = 'pointsIntervalSel_' + visualizationType + "_" + gasNameSessionId;
    var gasVisualizationType = gasNameSessionId;
    var htmlCanvas ='<div class="row" id="' + rowIdGasVisualization + '">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div>' +
                                    '<h6 class="mb-0" style="float:left">' + gasName + ' - ' + gasSession + '</h6>' +
                                    selIntervalHtml + 
                                    selPointsHtml + 
                                '</div>' +
                                getMovingButtonsHtmlNew(gasNameSessionId, visualizationType) + 
                                '<canvas id="' + gasVisualizationType + '"></canvas>' +
                            '</div>' +
                        '</div>' + 
                        '</div>' + 
                    '</div>';
    return htmlCanvas;
}
// moving buttons through iterated points (new implementation)
function getMovingButtonsHtmlNew(gasNameId, visualizationType) {
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