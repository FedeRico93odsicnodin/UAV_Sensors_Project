/*
    Here it is placed all the dynamic html for the graph rendering 
    (done in the distributionGraphsCreator script)
*/
// new function for visualizing the current substances 
function createBodyGraphsCurrSession(data, gasNameSessionId) {
    // getting the HTML for the selection of the type of visualization 
    var vis_interval = data.vis_granularity;
    var setIntervalsHtml = decideTimeIntervalSelectionHtml(gasNameSessionId, vis_interval);
    // getting the HTML for the current presentation points 
    var interval_len = data.gasData.lenInd;
    var selPointsHtml = decidePointsIntervalSelectionHtml(gasNameSessionId, interval_len);
    // creation of the HTML for the current container of visualization
    var gasName = data.gasName;
    var gasSessionName = data.gasData.sessionName;
    var visType = data.vis_granularity;
    var currVisualizationContainer = createGasCanvas(
        gasName, 
        gasSessionName, 
        gasNameSessionId,
        setIntervalsHtml,
        selPointsHtml
        );
    // creation of the object for the identification of the gasNameSessionId owner
    var currGasNameSingleRender = {
        "gasNameSessionId" : gasNameSessionId,
        "htmlRender" : currVisualizationContainer
    }
    return currGasNameSingleRender;
}
// deciding how many selections for time visualizations add to curve (new version)
function decideTimeIntervalSelectionHtml(gasNameSessionId, currGranularity) {
    // getting the new selector of num of points ID basing the decision on current gas and session
    var selTimeInterval = getIdCurrentSelectorIntervals(gasNameSessionId);
    // enabling all the possible visualization granularity: at least one point for each of the selection is possible to visualize 
    var selStartHtml = '<select class="select" style="float:right" id="' + selTimeInterval + '" onchange="setNewIntervalGraph(this);">'
    if(currGranularity == "mmm") {
        selStartHtml += '<option value="mmm" selected>mmm</option>';
    }
    else {
        selStartHtml += '<option value="mmm">mmm</option>';
    }
    if(currGranularity == "ss") {
        selStartHtml += '<option value="ss" selected>ss</option>';
    }
    else {
        selStartHtml += '<option value="ss">ss</option>';
    }
    if(currGranularity == "mm") {
        selStartHtml += '<option value="mm" selected>mm</option>';
    }
    else {
        selStartHtml += '<option value="mm">mm</option>';
    }
    if(currGranularity == "hh") {
        selStartHtml += '<option value="hh" selected>hh</option>';
    }
    else {
        selStartHtml += '<option value="hh">hh</option>';
    }
    selStartHtml += '</select>';
    return selStartHtml;
}
// deciding how many selections for points to display on curve (new version)
function decidePointsIntervalSelectionHtml(gasNameSessionId, currVisualizationNum) {
    var selPointsInterval = getIdCurrentSelectorPoints(gasNameSessionId);
    // if num of points less than 5 the menu will not be created 
    if(currVisualizationNum < 5) {
        return '<select class="select" hidden="true" style="float:right;margin-right:10px" id="' + selPointsInterval + '" onchange="setNewNumPointsGraph(this);"></select>'
    }
    var selStartHtml = '<select class="select" style="float:right;margin-right:10px" id="' + selPointsInterval + '" onchange="setNewNumPointsGraph(this);">'
    selStartHtml += getCurrentSelectorTimePointsHtml(currVisualizationNum);
    selStartHtml += '</select>'
    return selStartHtml
}
// obtaining html for the selections to insert in the selector of time points 
function getCurrentSelectorTimePointsHtml(currVisualizationNum) {
    var currSelectionsGranularity = "";
    currSelectionsGranularity += '<option value="5">5</option>';
    if(currVisualizationNum < 10) {
        currSelectionsGranularity += '<option value="all">all</option>';
        return currSelectionsGranularity;
    }
    currSelectionsGranularity += '<option value="10">10</option>';
    if(currVisualizationNum < 25) {
        currSelectionsGranularity += '<option value="all">all</option>';
        return currSelectionsGranularity;
    }
    currSelectionsGranularity += '<option value="25">25</option>';
    if(currVisualizationNum < 50) {
        currSelectionsGranularity += '<option value="all">all</option>';
        return currSelectionsGranularity;
    }
    currSelectionsGranularity += '<option value="50">50</option>';
    if(currVisualizationNum < 100) {
        currSelectionsGranularity += '<option value="all">all</option>';
        return currSelectionsGranularity;
    }
    currSelectionsGranularity += '<option value="100">100</option>';
    currSelectionsGranularity += '<option value="all">all</option>';
    return currSelectionsGranularity;
}
// html for rendering single canvas gas visualizer (new implementation)
function createGasCanvas(gasName, gasSession, gasNameSessionId, selIntervalHtml, selPointsHtml) {
    // rendered html 
    var rowIdGasVisualization = gasNameSessionId + "_row";
    var rowIdGasSelectionDiv = getIdCurrentDivSelectionsForCanvas(gasNameSessionId);
    var gasVisualizationType = gasNameSessionId;
    var htmlCanvas ='<div class="row" id="' + rowIdGasVisualization + '">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div id="' + rowIdGasSelectionDiv + '">' +
                                    '<h6 class="mb-0" style="float:left">' + gasName + ' - ' + gasSession + '</h6>' +
                                    selIntervalHtml + 
                                    selPointsHtml + 
                                '</div>' +
                                getMovingButtonsHtmlNew(gasNameSessionId) + 
                                '<canvas id="' + gasVisualizationType + '"></canvas>' +
                            '</div>' +
                        '</div>' + 
                        '</div>';
    return htmlCanvas;
}
// moving buttons through iterated points (new implementation)
function getMovingButtonsHtmlNew(gasNameSessionId) {
    var moveForwardValueId = getMoveForwardValueId(gasNameSessionId);
    var moveBackwardValueId = getMoveBackwardValueId(gasNameSessionId);
    var gasNameIdMoveForward = getMoveBtnForwardId(gasNameSessionId);
    var gasNameIdMoveBackward = getMoveBtnBackwardId(gasNameSessionId);
    var gasNameIdMoveBtnsMenuId = getMoveBtnsMenuId(gasNameSessionId);
    var renderHtml = '<div style="margin-top:35px" id="' + gasNameIdMoveBtnsMenuId + '">' + 
    '<span onclick="moveBackward(this)" class="bi bi-arrow-left-circle" style="float:left;font-size: 1.5rem;" id="' + gasNameIdMoveBackward + '""></span>' + 
    '<input type="text" style="width:35px;height:20px;float:left;margin-left:7.5px;margin-top:8.5px" value="1" id="' + moveBackwardValueId + '"></input>'+
    
    '<span onclick="moveForward(this)" class="bi bi-arrow-right-circle" style="float:right;font-size: 1.5rem;" id="' + gasNameIdMoveForward +'"></span>' + 
    '<input type="text" style="width:35px;height:20px;float:right;margin-right:7.5px;margin-top:8.5px" value="1" id="' + moveForwardValueId + '"></input>'+
    '</div>';
    return renderHtml;
}
// getting the substance name and id from the gas name session id 
function getGasNameIdFromLabelCarouselPreparation(gasNameSessionId) {
    var idParts = gasNameSessionId.split("_");
    var gasNameId = idParts[0] + "_" + idParts[1];
    return gasNameId;
}
// preparation of the SINGLE carousel distinguishing by all elements in the content array 
function prepareCarouselHtml(htmlContentArray) {
    // the html for the current substance and for displaying all the sessions 
    var currHtmlCarouselRender = '';
    var currGasReference = '';
    var carouselObjects = {};
    // indicating the active carousel element for the current gas 
    var firstElement = false;
    for(var i in htmlContentArray) {
        // treating the first element of the content set 
        if(currGasReference == '') {
            currGasReference = getGasNameIdFromLabelCarouselPreparation(htmlContentArray[i].gasNameSessionId);
            firstElement = true;
        }
        // curr gas name id 
        var currGasNameId = getGasNameIdFromLabelCarouselPreparation(htmlContentArray[i].gasNameSessionId);
        // creating the final html 
        if(currGasReference != currGasNameId) {
            carouselObjects[currGasReference] = currHtmlCarouselRender;
            // resetting variables for next iterations 
            currGasReference = getGasNameIdFromLabelCarouselPreparation(htmlContentArray[i].gasNameSessionId);
            currHtmlCarouselRender = '';
            firstElement = true;
        }
        // handling for the visualization of the active carousel
        if(firstElement) {
            var currHtmlElement = '<div class="carousel-item active">' + htmlContentArray[i].htmlRender + '</div>';
            currHtmlCarouselRender += currHtmlElement;
            firstElement = false;
            continue;
        }
        // handling the enqueued and not visible carousels for the other sessions 
        var currHtmlElement = '<div class="carousel-item">' + htmlContentArray[i].htmlRender + '</div>';
        currHtmlCarouselRender += currHtmlElement;
    }
    // adding the last element to the set 
    carouselObjects[currGasReference] = currHtmlCarouselRender;
    return carouselObjects
}
// preparation of all the carousel block with its main part for the current render of the substance display
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
