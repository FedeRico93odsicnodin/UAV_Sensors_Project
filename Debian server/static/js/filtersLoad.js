// GLOBAL VARIABLES
// overall loaded elements from GET filters requests 
var OverallSensors = []
var OverallGases = []
var OverallSessions = []

// colors for the various gases 
var GasColors = {}
var StoredGasColors = {}

// new values for the sessions date and time 
var SessionsDateTimes = {}
var StoredSessionsDateTimes = {}
var timeInit = 0;

// loaded filters matrix 
var loadedFiltersParams = {}
var isEmptyDatabase = false
// Initiazation for the date selections filters 
function initDateFilters(showView, callBackFilters) {
    $.ajax({
        url: "/filters/date"
        , success: function(data) {
            if(data == "null") {
                // console.log('no data')
                isEmptyDatabase = true
                if(checkIfLoadedFilters('DateFilters')) {
                    setTimeout(function() {document.location.reload()}, 3000)
                }
                return
            }
            var datesObj = JSON.parse(data)
            // getting the already stored filters 
            var filtersObj = getSessionStorageFilters()
            var minDateToApply = ''
            var maxDateToApply = ''
            var minTimeToApply = ''
            var maxTimeToApply = ''
            if(filtersObj != null) {
                if("intervalSelection" in filtersObj) {
                    document.getElementById("intervalSelection").value = filtersObj["intervalSelection"]["filter_value"]
                }
                else {
                    document.getElementById("intervalSelection").value = "None"
                }
                if("min_date_filter" in filtersObj) {
                    minDateToApply = filtersObj["min_date_filter"]["filter_value"]
                }
                if("max_date_filter" in filtersObj) {
                    maxDateToApply = filtersObj["max_date_filter"]["filter_value"]
                }
                if("min_time_filter" in filtersObj) {
                    minTimeToApply = filtersObj["min_time_filter"]["filter_value"]
                }
                if("max_time_filter" in filtersObj) {
                    maxTimeToApply = filtersObj["max_time_filter"]["filter_value"]
                }
            }
            // setting the range date for the current selection 
            var minDateParsed = parseDate(datesObj['minDate'][0])
            var maxDateParsed = parseDate(datesObj['maxDate'][0])
            $( ".date_picker" ).datepicker({
                minDate: new Date(minDateParsed),
                maxDate: new Date(maxDateParsed)
            });
            // eventual application of retrieved dates 
            if(minDateToApply != '') {
                document.getElementById("min_date_filter").value = minDateToApply
            }
            if(maxDateToApply != '') {
                document.getElementById("max_date_filter").value = maxDateToApply
            }

            // setting the time for the current selection 
            var minTimeParsed = parseTime(datesObj['minDate'][0])
            var maxTimeParsed = parseTime(datesObj['maxDate'][0])
            // same starting and ending date 
            if(minDateParsed.getTime() == maxDateParsed.getTime()) {
                $(".time_picker").timepicker({
                    timeFormat: 'h:mm p',
                    interval: 30,
                    minTime: minTimeParsed,
                    maxTime: maxTimeParsed,
                    defaultTime: minTimeParsed,
                    startTime: minTimeParsed,
                    dynamic: false,
                    dropdown: true,
                    scrollbar: true
                });
            }
            // different dates for selection
            else {
                $("#min_time_filter").timepicker({
                    timeFormat: 'h:mm p',
                    interval: 30,
                    minTime: minTimeParsed,
                    maxTime: "00:00",
                    defaultTime: minTimeParsed,
                    startTime: minTimeParsed,
                    dynamic: false,
                    dropdown: true,
                    scrollbar: true
                });
                $("#max_time_filter").timepicker({
                    timeFormat: 'h:mm p',
                    interval: 30,
                    minTime: "00:00",
                    maxTime: maxTimeParsed,
                    defaultTime: maxTimeParsed,
                    startTime: maxTimeParsed,
                    dynamic: false,
                    dropdown: true,
                    scrollbar: true
                });
            }
            // eventual application of retrieved times 
            if(minTimeToApply != '') {
                document.getElementById("min_time_filter").value = minTimeToApply
            }
            if(maxTimeToApply != '') {
                document.getElementById("max_time_filter").value = maxTimeToApply
            }
            if(showView == true) {
                showDateFiltersView()
                return
            }
            if(checkIfLoadedFilters('DateFilters'))
                callBackFilters()
        }
        , error: function(err) {
            console.log('an error occur retrieving range dates info:\n' + err)
        }
    })
}
// Initialization for the sensors selection filters 
function initSensorsFilters(showView, callBackFilters) {
    $.ajax({
        url: "/filters/sensors"
        , success: function(data) {
            if(data == "[]") {
                // console.log('no data')
                isEmptyDatabase = true
                if(checkIfLoadedFilters('SensorsFilters')) {
                    setTimeout(function() {document.location.reload()}, 3000)
                }
                return
            }
            OverallSensors = []
            var sensObj = JSON.parse(data)
            var sessionFilters = getSessionStorageFilters()
            $("#sensTable").empty()
            // appending sensors to filters 
            for(var ind in sensObj) {
                var sensorIdentifier = sensObj[ind].name + "_" + sensObj[ind].id
                if(sensorIdentifier in sessionFilters) {
                    if(sessionFilters[sensorIdentifier]["selected"] == "0") {
                        checked = false
                    }
                }
                var checkId = sensorIdentifier + "_check";
                var inputAdjustId = sensorIdentifier + "_adjust";
                console.log(sensObj[ind]);
                var currRowSens = '<tr>' + 
                    '<td style="width:25px">' + 
                        '<input class="form-check-input" type="checkbox" id="' + checkId + '" />' + 
                    '</td>' + 
                    '<td style="width:100px" id="' + sensorIdentifier + '"><b>' + sensObj[ind].name + '</b></td>' + 
                    '<td style="width:100px">' + 
                        '<div><b>min:</b> ' + sensObj[ind].minVal + '</div>' + 
                    '</td>' + 
                    '<td style="width:100px">' + 
                        '<div><b>max:</b> ' + sensObj[ind].maxVal + '</div>' + 
                    '</td>' + 
                    '<td style="width:100px">' + 
                        '<div><b>avg:</b> ' + sensObj[ind].avgVal + '</div>' + 
                    '</td>' + 
                    '<td style="width:100px">' + 
                        '<div><b>adjustment from:</b> <input style="margin-left:3px" id="' + inputAdjustId + '"></input></div>' +
                    '</td>' + 
                    '</tr>'
                sensObj[ind]['checkId'] = checkId;
                sensObj[ind]['filterNameId'] = sensorIdentifier;
                sensObj[ind]['adjustId'] = inputAdjustId;
                $('#sensTable').append(currRowSens);
                OverallSensors.push(sensObj[ind])
            }
            for(var ind in sensObj) {
                var checked = true
                var sensorIdentifier = sensObj[ind].name + "_" + sensObj[ind].id
                if(sensorIdentifier in sessionFilters) {
                    if(sessionFilters[sensorIdentifier]["selected"] == "0") {
                        checked = false
                    }
                }
                var checkId = sensorIdentifier + "_check"
                document.getElementById(checkId).checked = checked
            }
            if(showView == true) {
                showSensorsFiltersView()
                return
            }
            if(checkIfLoadedFilters('SensorsFilters'))
                callBackFilters()
        }
        , error: function(err) {
            console.log('an error occur retrieving sensors info:\n' + err)
        }
    })
}
// getting the gas identifier from the color picker 
function getGasIdentifierFromColorPicker(colorPickerId) {
    var colorPickerMarker = 'colorPicker_';
    var gasId = colorPickerId.substring(colorPickerMarker.length);
    return gasId;
}
// getting the gas identifier from the gasNameId
function getGasIdFromGasNameId(gasNameId) {
    var gasNameIdParts = gasNameId.split('_');
    try {
        var gasId = parseInt(gasNameIdParts[1]);
        return gasId;
    }
    catch(e) {
        return 0
    }
}
// Initializations for the gases selection filters 
function initGasesFilters(showView, callBackFilters) {
    $.ajax({
        url: "/filters/gases"
        , success: function(data) {
            if(data == "[]") {
                // console.log('no data')
                isEmptyDatabase = true
                if(checkIfLoadedFilters('GasesFilters')) {
                    setTimeout(function() {document.location.reload()}, 3000)
                }
                return
            }
            var gasesObj = JSON.parse(data)
            var sessionFilters = getSessionStorageFilters()
            // resetting params population 
            $("#gasesTable").empty()
            OverallGases = []
            GasColors = {}
            // appending sensors to filters 
            for(var ind in gasesObj) {
                var gasIdentifier = gasesObj[ind].name + "_" + gasesObj[ind].id
                var gasColor = gasesObj[ind].color
                var checkId = gasIdentifier + "_check"
                // adding the checkbox for gas selection and the color picker for the gas color 
                var currRowGas = '<tr>' + 
                                    '<td style="width:25px">' + 
                                        '<input class="form-check-input" type="checkbox" id="' + checkId + '">' + 
                                    '</td>' + 
                                    '<td id="' + gasIdentifier + '">' 
                                        + gasesObj[ind].name + '</td>' +
                                    '<td><button id="' + 'colorPicker_' + gasIdentifier + '">Change Color</button></td>' + 
                                    '<td><div id="' + 'colorShower_' + gasIdentifier + '" style="padding:15px;background-color:rgb(' + gasColor + ');border-radius:5px"></div></td>' + 
                                    '</tr>'
                gasesObj[ind]['checkId'] = checkId
                gasesObj[ind]['filterNameId'] = gasIdentifier
                // populating the values for the colors of the gas 
                var objGasColorPopulation = {'Id': gasesObj[ind].id, 'color': gasesObj[ind].color};
                StoredGasColors[gasIdentifier] = objGasColorPopulation;
                $('#gasesTable').append(currRowGas);
                // creation of the color picker for the current gas 
                var colorPickerCurrGas = '#colorPicker_' + gasIdentifier;
                $(colorPickerCurrGas).colpick({
                    color: gasColor,
                    onSubmit: function() {
                        var newColor = this.fields[0].value;
                        var newColorSel = "#" + newColor;
                        // getting the rgb definition to be stored 
                        var colorR = this.fields[1].value;
                        var colorG = this.fields[2].value;
                        var colorB = this.fields[3].value;
                        var complexiveRGB = colorR + "," + colorG + "," + colorB;
                        // console.log(newColorSel);
                        // changing the color of the displayed visualization 
                        var gasNameId = getGasIdentifierFromColorPicker(this.el.id);
                        var colorShowerGas = 'colorShower_' + gasNameId;
                        document.getElementById(colorShowerGas).style.backgroundColor = newColorSel;
                        // memorizing the new configuration for an eventual save 
                        var gasId = getGasIdFromGasNameId(gasNameId);
                        GasColors[gasNameId] = { "Id": gasId, "color": complexiveRGB };
                        
                    }
            });
                OverallGases.push(gasesObj[ind])
            }
            for(var ind in gasesObj) {
                var checked = true 
                var gasIdentifier = gasesObj[ind]['filterNameId']
                if(gasIdentifier in sessionFilters) {
                    if(sessionFilters[gasIdentifier]["selected"] == "0") {
                        checked = false
                    }
                }
                var checkId = gasesObj[ind]['checkId']
                document.getElementById(checkId).checked = checked
            }
            if(showView == true) {
                showGasesFiltersView()
                return
            }
            if(checkIfLoadedFilters('GasesFilters'))
                callBackFilters()
        }
        , error: function(err) {
            console.log('an error occur retrieving gases info:\n' + err)
        }
    })
}
// cleaning the session name for creating the id 
function initIdSessionFromName(sessionName) {
    sessionName = sessionName.replaceAll(' ', '');
    sessionName = sessionName.replaceAll(':', '');
    sessionName = sessionName.replaceAll('.', '');
    sessionName = sessionName.replaceAll('-', '');
    return sessionName;
}
// getting the session identifier from the built id 
function getSessionIdFromBuiltId(buildId) {
    var splittedId = buildId.split('_');
    var sessionId = splittedId[0] + '_' + splittedId[1];
    return sessionId;
}
// getting the id of the stored session from the built id 
function getStoredSessionIdFromBuiltId(buildId) {
    var splittedId = buildId.split('_');
    var sessionStoredId = parseInt(splittedId[1]);
    return sessionStoredId;
}
// Initialization for the sessions selection filters 
function initSessionsFilters(showView, callBackFilters) {
    $.ajax({
        url: "/filters/sessions"
        , success: function(data) {
            if(data == "[]") {
                // console.log('no data')
                isEmptyDatabase = true
                if(checkIfLoadedFilters('SessionsFilters')) {
                    setTimeout(function() {document.location.reload()}, 3000)
                }
                return
            }
            var sessionObj = JSON.parse(data)
            var sessionFilters = getSessionStorageFilters()
            // resetting parameters 
            OverallSessions = []
            SessionsDateTimes = {}
            // initialization for the date and time pickers 
            timeInit = sessionObj.length;
            $("#sessionsTable").empty()
            // appending sensors to filters 
            for(var ind in sessionObj) {
                var sessionNameCleaned = initIdSessionFromName(sessionObj[ind].name);
                var sessionIdentifier = sessionNameCleaned + "_" + sessionObj[ind].id
                var sessionIdentifierDatePicker = sessionIdentifier + "_date";
                var sessionIdentifierTimePicker = sessionIdentifier + "_time";
                var checkId = sessionIdentifier + "_check"

                // initializing the date object 
                var initDateSession = new Date(sessionObj[ind].begin_date);
                StoredSessionsDateTimes[sessionIdentifier] = initDateSession;

                var currRowSession = 
                '<tr>'
                    + '<td style="width:25px">' 
                        + '<input class="form-check-input" type="checkbox" id="' + checkId + '"/>'
                    + '</td>' 
                        + '<td id="' + sessionIdentifier + '">' 
                            + sessionObj[ind].name 
                    + '</td>'
                    + '<td> add an initial date: </td>'
                    + '<td>' + '<input id="' + sessionIdentifierDatePicker + '"></input></td>'
                    + '<td>' + '<input id="' + sessionIdentifierTimePicker + '"></input></td>'
                 + '</tr>'
                
                sessionObj[ind]['checkId'] = checkId
                sessionObj[ind]['filterNameId'] = sessionIdentifier
                $('#sessionsTable').append(currRowSession);
                // creation of date and time picker for deciding the hour of each session
                $( "#" + sessionIdentifierDatePicker ).datepicker(
                    {
                        dynamic: false,
                        dropdown: true,
                        scrollbar: true,
                        setDate : initDateSession,
                        onSelect: function(dataText) {
                            // decrementation on eventual initialization
                            if(dateInit)
                            // getting the current session identifier
                            var currIdElement = $(this)[0].attributes.id.value;
                            // console.log(currIdElement);
                            var sessionId = getSessionIdFromBuiltId(currIdElement);
                            // console.log(sessionId);
                            // getting the stored date for the selected session 
                            var storedDate = StoredSessionsDateTimes[sessionId];
                            // verifying if a modification for the date already exists
                            if(SessionsDateTimes.hasOwnProperty(sessionId)) {
                                // console.log('a modification for the date already occur')
                                storedDate = SessionsDateTimes[sessionId].modifiedDate;
                            }
                            // console.log('stored date ' + storedDate);
                            // getting aa new date for the selected date from the picker 
                            var newDatePart = new Date(dataText);
                            // console.log('changing the date part from the date ' + newDatePart);
                            // calculation for the new date 
                            var newYear = newDatePart.getFullYear();
                            var newMonth = newDatePart.getMonth();
                            var newDay = newDatePart.getDate();
                            var storedHour = storedDate.getHours();
                            var storedMinutes = storedDate.getMinutes();
                            var storedSeconds = storedDate.getSeconds();
                            var storedMillis = storedDate.getMilliseconds();
                            var newDate = new Date(
                                newYear, 
                                newMonth,
                                newDay,
                                storedHour,
                                storedMinutes,
                                storedSeconds,
                                storedMillis
                                );
                            // console.log(newDate);
                            // getting the id for the current session
                            var currSessionId = getStoredSessionIdFromBuiltId(sessionId);
                            // creation of the new object for the date modification 
                            var dateModificationObj = {
                                'sessionId': currSessionId, 
                                'modifiedDate': newDate,
                                'dateYear': newDate.getFullYear(),
                                'dateMonth': newDate.getMonth(),
                                'dateDay': newDate.getDate(),
                                'dateHour': newDate.getHours(),
                                'dateMinutes': newDate.getMinutes(),
                                'dateSeconds': newDate.getSeconds(),
                                'dateMillis': newDate.getMilliseconds()
                            }
                            SessionsDateTimes[sessionId] = dateModificationObj;
                        }
                    }
                ).datepicker("setDate", initDateSession);
                $( "#" + sessionIdentifierTimePicker ).timepicker(
                    {
                        defaultTime: initDateSession.getHours() + ":" + initDateSession.getMinutes(),
                        change: function(timeDate) {
                            // while initialization: decrement 
                            if(timeInit > 0) {
                                timeInit = timeInit -1;
                                return;
                            }
                            // getting the current session identifier
                            var currIdElement = $(this)[0].attributes.id.value;
                            // console.log(currIdElement);
                            var sessionId = getSessionIdFromBuiltId(currIdElement);
                            // console.log(sessionId);
                            // getting the stored date for the selected session 
                            var storedDate = StoredSessionsDateTimes[sessionId];
                            // verifying if a modification for the date already exists
                            if(SessionsDateTimes.hasOwnProperty(sessionId)) {
                                // console.log('a modification for the date already occur');
                                storedDate = SessionsDateTimes[sessionId].modifiedDate;
                            }
                            // console.log('stored date ' + storedDate);
                            // no necessity for a new conversion in date 
                            var newTimePart = timeDate;
                            // calculation for the new date
                            var storedYear = storedDate.getFullYear();
                            var storedMonth = storedDate.getMonth();
                            var storedDay = storedDate.getDate();
                            var newHour = newTimePart.getHours();
                            var newMinutes = newTimePart.getMinutes();
                            var newSeconds = newTimePart.getSeconds();
                            var newMillis = newTimePart.getMilliseconds();
                            var newDate = new Date(
                                storedYear, 
                                storedMonth,
                                storedDay,
                                newHour,
                                newMinutes,
                                newSeconds,
                                newMillis
                                );
                            // console.log(newDate);
                            // getting the id for the current session
                            var currSessionId = getStoredSessionIdFromBuiltId(sessionId);
                            // creation of the new object for the date modification 
                            var dateModificationObj = {
                                'sessionId': currSessionId, 
                                'modifiedDate': newDate,
                                'dateYear': newDate.getFullYear(),
                                'dateMonth': newDate.getMonth(),
                                'dateDay': newDate.getDate(),
                                'dateHour': newDate.getHours(),
                                'dateMinutes': newDate.getMinutes(),
                                'dateSeconds': newDate.getSeconds(),
                                'dateMillis': newDate.getMilliseconds()
                            }
                            SessionsDateTimes[sessionId] = dateModificationObj;
                        }
                    }
                );

                OverallSessions.push(sessionObj[ind])
            }
            for(var ind in sessionObj) {
                var checked = true 
                var sessionIdentifier = sessionObj[ind]['filterNameId']
                if(sessionIdentifier in sessionFilters) {
                    if(sessionFilters[sessionIdentifier]["selected"] == "0") {
                        checked = false
                    }
                }
                var checkId = sessionObj[ind]['checkId']
                document.getElementById(checkId).checked = checked
            }
            if(showView == true) {
                showSessionsFiltersView()
                return
            }
            if(checkIfLoadedFilters('SessionsFilters'))
                callBackFilters()
        }
        , error: function(err) {
            console.log('an error occur retrieving gases info:\n' + err)
        }
    })
}
// Initialization for the general options filters 
function initOptionsFilters(showView, callBackFilters) {
    var sessionFilters = getSessionStorageFilters()
    if("visualizationType" in sessionFilters) {
        if(sessionFilters["visualizationType"]["selected"] == "0") {
            document.getElementById("visualizationType").value = sessionFilters["visualizationType"]["filter_value"]
        }
        else {
            document.getElementById("visualizationType").value = sessionFilters["visualizationType"]["filter_value"]
        }
    }
    if("show_median" in sessionFilters) {
        if(sessionFilters["show_median"]["selected"] == "0") {
            document.getElementById("show_median_check").checked = false
        }
        else {
            document.getElementById("show_median_check").checked = true
        }
    }
    if("temperature_time_graph" in sessionFilters) {
        if(sessionFilters["temperature_time_graph"]["selected"] == "0") {
            document.getElementById("temperature_time_graph_check").checked = false
        }
        else {
            document.getElementById("temperature_time_graph_check").checked = true
        }
    }
    if("humidity_time_graph" in sessionFilters) {
        if(sessionFilters["humidity_time_graph"]["selected"] == "0") {
            document.getElementById("humidity_time_graph_check").checked = false
        }
        else {
            document.getElementById("humidity_time_graph_check").checked = true
        }
    }
    if("ppms_temperature_graph" in sessionFilters) {
        if(sessionFilters["ppms_temperature_graph"]["selected"] == "0") {
            document.getElementById("ppms_temperature_graph_check").checked = false
        }
        else {
            document.getElementById("ppms_temperature_graph_check").checked = true
        }
    }
    if("ppms_humidity_graph" in sessionFilters) {
        if(sessionFilters["ppms_humidity_graph"]["selected"] == "0") {
            document.getElementById("ppms_humidity_graph_check").checked = false
        }
        else {
            document.getElementById("ppms_humidity_graph_check").checked = true
        }
    }
    
    if(showView == true) {
        showOptionsFiltersView()
        return
    }
    if(checkIfLoadedFilters('OptionsFilters')) {
        callBackFilters()
    }
    if(isEmptyDatabase) {
        setTimeout(function() {document.location.reload()}, 3000)
        return
    } 
}
// Matrix of all the filters to be loaded
function initLoadedFiltersMatrix() {
    loadedFiltersParams['DateFilters'] = false
    loadedFiltersParams['SensorsFilters'] = false
    loadedFiltersParams['GasesFilters'] = false
    loadedFiltersParams['SessionsFilters'] = false
    loadedFiltersParams['OptionsFilters'] = false
}
// verification that all the filters has been loaded 
function checkIfLoadedFilters(currLoaded) {
    loadedFiltersParams[currLoaded] = true
    for(var k in loadedFiltersParams) {
        if(loadedFiltersParams[k] == false) 
            return false
    }
    return true
}
// load all the filtes without refreshing the view
function initAllFilters(callBackFunction) {
    // resetting filter matrix before call 
    initLoadedFiltersMatrix()
    isEmptyDatabase = false
    initDateFilters(false, callBackFunction)
    initSensorsFilters(false, callBackFunction)
    initGasesFilters(false, callBackFunction)
    initSessionsFilters(false, callBackFunction)
    initOptionsFilters(false, callBackFunction)
}