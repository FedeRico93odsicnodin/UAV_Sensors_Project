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
    // creation of the object for the identification of the gasNameSessionId owner
    var currGasNameSingleRender = {
        "gasNameSessionId" : gasNameSessionId,
        "htmlRender" : currVisualizationContainer
    }
    return currGasNameSingleRender;
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
