// show if the current context is visualizing data or selecting filters
var isFilterContext = false
// getting the date from a string version in which the format is yy-mm-dd
function parseDate(currDate) {
    var dateTimeParts = currDate.split(' ')
    var dateParts = dateTimeParts[0].split('-')
    return new Date(dateParts[0], dateParts[1], dateParts[2])
}
// getting the time from the string date with approximation at 30 minutes each interval 
function parseTime(currDate) {
    var dateTimeParts = currDate.split(' ')
    var timeParts = dateTimeParts[1].split(':')
    var hour = "0"
    var minutes = "0"
    if(timeParts[0].length == 2) {
        hour = timeParts[0]
    }
    else {
        hour += timeParts[0]
    }
    if(parseInt(timeParts[1] >= 30)) {
        minutes = "30"
    }
    else {
        minutes = "00"
    }
    return hour + ":" + minutes
}
// returning an object with a distiction of respecitve parts of the time of the date 
function parseTimeComplete(currDate) {
    var dateTimeParts = currDate.split(' ')
    var timeParts = dateTimeParts[1].split(':')
    var hour = timeParts[0]
    var minutes = timeParts[1]
    var seconds = timeParts[2]
    var secondsCleaned = seconds.split(".")
    seconds = secondsCleaned[0]
    return {"hh": hour, "mm": minutes, "ss": seconds, "mmm": seconds[1]}
}
// getting the approximated data to visualize in milliseconds interval. In this case all the set of points will be retrieved 
function getDataToDisplayMMM(dataObj) {
    var dataDisplay = {}
    dataDisplay['labels'] = []
    dataDisplay['data'] = []
    for(var currEntry in dataObj.gasData) {
        var currDate = dataObj.gasData[currEntry][0]
        // cutting away the last three position of millis definition for clearness
        currDate = currDate.substring(0, currDate.length - 3);
        var currVal = dataObj.gasData[currEntry][1]
        dataDisplay['labels'].push(currDate)
        dataDisplay['data'].push(currVal)
    }
    return dataDisplay
}
// getting the approximated data to visualize in seconds interval. Everything in the interval of seconds will be mediated 
function getDataToDisplaySS(dataObj) {
    var dataDisplay = {}
    dataDisplay['labels'] = []
    dataDisplay['data'] = []
    var currMedian
    var currTimeVal = null
    var currSecs
    var currMins
    var currHours
    for(var currEntry in dataObj.gasData) {
        var currDate = dataObj.gasData[currEntry][0]
        var currVal = dataObj.gasData[currEntry][1]
        var dateRange = parseTimeComplete(currDate)
        if(currTimeVal == null) {
            currMins = dateRange['mm']
            currHours = dateRange['hh']
            currTimeVal = dateRange['ss']
            currMedian = currVal
            continue
        }
        if(currTimeVal == dateRange['ss'] && dateRange['mm'] == currMins && dateRange['hh'] == currHours) {
            currMedian += currVal
            currMedian = currMedian / 2
            continue
        
        }
        dataDisplay['labels'].push(currHours + ":" + currMins + ':' + currTimeVal)
        dataDisplay['data'].push(currMedian)
        currTimeVal = dateRange['ss']
        currMins = dateRange['mm']
        currHours = dateRange['hh']
        currMedian = currVal
    }
    dataDisplay['labels'].push(currHours + ":" + currMins + ':' + currTimeVal)
    dataDisplay['data'].push(currMedian)
    return dataDisplay
}
// getting the approximated data to visualize in minutes interval. Everything in the interval of minutes will be mediated 
function getDataToDisplayMM(dataObj) {
    var dataDisplay = {}
    dataDisplay['labels'] = []
    dataDisplay['data'] = []
    var currMedian
    var currTimeVal = null
    var currHours
    for(var currEntry in dataObj.gasData) {
        var currDate = dataObj.gasData[currEntry][0]
        var currVal = dataObj.gasData[currEntry][1]
        var dateRange = parseTimeComplete(currDate)
        if(currTimeVal == null) {
            currTimeVal = dateRange['mm']
            currHours = dateRange['hh']
            currMedian = currVal
            continue
        }
        if(currTimeVal == dateRange['mm'] && dateRange['hh'] == currHours) {
            currMedian += currVal
            currMedian = currMedian / 2
            continue
        
        }
        dataDisplay['labels'].push(currHours + ":" + currTimeVal)
        dataDisplay['data'].push(currMedian)
        currTimeVal = dateRange['mm']
        currHours = dateRange['hh']
        currMedian = currVal
    }
    dataDisplay['labels'].push(currHours + ":" + currTimeVal)
    dataDisplay['data'].push(currMedian)
    return dataDisplay
}
// getting the approximated data to visualize in hours interval. Everything in the interval of hours will be mediated 
function getDataToDisplayHH(dataObj) {
    var dataDisplay = {}
    dataDisplay['labels'] = []
    dataDisplay['data'] = []
    var currMedian
    var currTimeVal = null
    for(var currEntry in dataObj.gasData) {
        var currDate = dataObj.gasData[currEntry][0]
        var currVal = dataObj.gasData[currEntry][1]
        var dateRange = parseTimeComplete(currDate)
        if(currTimeVal == null) {
            currTimeVal = dateRange['hh']
            currMedian = currVal
            continue
        }
        if(currTimeVal == dateRange['hh']) {
            currMedian += currVal
            currMedian = currMedian / 2
            continue
        
        }
        dataDisplay['labels'].push(currTimeVal)
        dataDisplay['data'].push(currMedian)
        currTimeVal = dateRange['hh']
        currMedian = currVal
    }
    dataDisplay['labels'].push(currTimeVal)
    dataDisplay['data'].push(currMedian)
    return dataDisplay
}
// making the sets different from a session to another 
function getSplittedSessionsData(rawData) {
    var orderedSessionsData = []
    var currSession = ''
    var currSessionID = 0
    var currSessionObj = {}
    for(var i in rawData['gasData']) {
        // initilization 
        if(currSession == '') {
            currSession = rawData['gasData'][i][2]
            currSessionID = rawData['gasData'][i][3]
            currSessionObj = {}
            currSessionObj['status'] = rawData['status']
            currSessionObj['gasName'] = rawData['gasName']
            currSessionObj['gasId'] = rawData['gasId']
            currSessionObj['gasData'] = []
            currSessionObj['gasData'].push(rawData['gasData'][i])
            // adding the overall session info 
            currSessionObj['session'] = currSession
            currSessionObj['sessionID'] = currSessionID
            continue
        }
        if(currSession != rawData['gasData'][i][2]) {
            currSession = rawData['gasData'][i][2]
            currSessionID = rawData['gasData'][i][3]
            orderedSessionsData.push(currSessionObj)
            currSessionObj = {}
            currSessionObj['status'] = rawData['status']
            currSessionObj['gasName'] = rawData['gasName']
            currSessionObj['gasId'] = rawData['gasId']
            currSessionObj['gasData'] = []
            currSessionObj['gasData'].push(rawData['gasData'][i])
            // adding the overall session info
            currSessionObj['session'] = currSession
            currSessionObj['sessionID'] = currSessionID
            continue
        }
        currSessionObj['gasData'].push(rawData['gasData'][i])
    }
    // pushing last element of sesssion 
    orderedSessionsData.push(currSessionObj)
    return orderedSessionsData
}
// checking if last point in the set for disabling the forward movement 
function checkIfLastPointInSet(currSet, allInterval) {
    var lastOverallPoint = allInterval["labels"][allInterval["labels"].length - 1]
    var currLastPointOnCurve = currSet["labels"][currSet["labels"].length - 1]
    if(lastOverallPoint == currLastPointOnCurve) {
        return true
    }
    return false
}
// checking if first point in the set for disabling backward movement 
function checkIfFitstPointInSet(currSet, allInterval) {
    var firstOverallPoint = allInterval["labels"][0]
    var currFirstPointOnCurve = currSet["labels"][0]
    if(firstOverallPoint == currFirstPointOnCurve) {
        return true
    }
    return false
}
// reloading data and back to dashboard context 
function backToDashboardReload() {
    loadDashboardData();
    backToDashboardContext();
}

// getting the parameters of the gas from the interval selector 
function getGasParametersFromIntervalSelectorId(intervalSelectorId) {
    // getting the parameters from the selector id 
    var gasParametersParts = intervalSelectorId.split("_");
    var gasName = gasParametersParts[1];
    var gasId = gasParametersParts[2];
    var sessionIdPart = gasParametersParts[3];
    var sessionId = sessionIdPart.substring(7);
    // creating the object to give back 
    var gasObject = {
        'gasName' : gasName,
        'gasId': gasId,
        'sessionId': sessionId
    };
    return gasObject;
}

// getting the id for the current selector of intervals to visualize
function getIdCurrentSelectorIntervals(gasNameSessionId) {
    var currSelectorPointsId = "pointsIntervalSel_" + gasNameSessionId;
    return currSelectorPointsId;
}
// getting the id forr the current selector of points to visualize
function getIdCurrentSelectorPoints(gasNameSessionId) {
    var currSelectorIntervalsId = 'pointsRangeSel_' + gasNameSessionId;
    return currSelectorIntervalsId;
}
// getting the id for the current div in which
// selector points for the canvas are rendered 
function getIdCurrentDivSelectionsForCanvas(gasNameSessionId) {
    var currIdDivSelectionsForCanvas = "selectionDiv_" + gasNameSessionId;
    return currIdDivSelectionsForCanvas;
}
// getting the id for the input value of how much points to move 
// eventually forward on the graph
function getMoveForwardValueId(gasNameSessionId) {
    var moveForwardInputID = "moveForwardValue_" + gasNameSessionId;
    return moveForwardInputID;
}
// getting the id for the input value fo how much points to move 
// eventually backward on the graph
function getMoveBackwardValueId(gasNameSessionId) {
    var moveBackwardInputID = "moveBackwardValue_" + gasNameSessionId;
    return moveBackwardInputID;
}
// getting the ID for the arrow of movement forward 
function getMoveBtnForwardId(gasNameSessionId) {
    var moveForwardBtnId = "moveBtnForward_" + gasNameSessionId;
    return moveForwardBtnId;
}
// getting the ID for the arrow of movement backward 
function getMoveBtnBackwardId(gasNameSessionId) {
    var moveBackwardBtnId =  "moveBtnBackward_" + gasNameSessionId;
    return moveBackwardBtnId;
}
// getting the value of the menu context of arrow movements on points
function getMoveBtnsMenuId(gasNameSessionId) {
    var menuPointsId = "moveButtons_" + gasNameSessionId;
    return menuPointsId;
}