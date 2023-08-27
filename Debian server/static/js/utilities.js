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