// GLOBAL VARIABLES
var OverallSensors = []
var OverallGases = []
var OverallSessions = []
// GLOBAL FUNCTIONS
function parseDate(currDate) {
    var dateTimeParts = currDate.split(' ')
    var dateParts = dateTimeParts[0].split('-')
    return new Date(dateParts[0], dateParts[1], dateParts[2])
}
function parseTime(currDate) {
    var dateTimeParts = currDate.split(' ')
    var timeParts = dateTimeParts[1].split(':')
    var hour = "0"
    var minutes = "0"
    console.log(timeParts)
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
function getSessionStorageFilters() {
    var sessionStorageFiltersStr = sessionStorage.getItem("filterOptions");
    if(typeof(sessionStorageFiltersStr != 'undefined')) {
        var allFilters = JSON.parse(sessionStorageFiltersStr)
        return allFilters
    }
    return null
}
function createFilterSessionObj(filterID, filterContext, selected, dataContent) {
    var newFilterOption = {}
    var selectedInt = 0
    if(selected) {
        selectedInt = 1
    }
    newFilterOption["selected"] = selectedInt 
    newFilterOption["filter_context"] = filterContext
    newFilterOption["filter_name"] = filterID 
    if(dataContent !== undefined) {
        newFilterOption["filter_value"] = dataContent
    }
    else {
        if(typeof(document.getElementById(filterID).value) != 'undefined')
            newFilterOption["filter_value"] = document.getElementById(filterID).value
        else 
            newFilterOption["filter_value"] = document.getElementById(filterID).innerHTML
    }
    return newFilterOption
}
function setNewSessionStorageFilters() {
    // overall filter object to persist 
    var newFilterObj = {}
    // all the filters concerning the dates 
    var datesSelections = (document.getElementById("intervalSelection").value != "None")
    newFilterObj["intervalSelection"] = createFilterSessionObj("intervalSelection", "Date", datesSelections)
    newFilterObj["min_date_filter"] = createFilterSessionObj("min_date_filter", "Date", datesSelections)
    newFilterObj["max_date_filter"] = createFilterSessionObj("max_date_filter", "Date", datesSelections)
    newFilterObj["min_time_filter"] = createFilterSessionObj("min_time_filter", "Date", datesSelections)
    newFilterObj["max_time_filter"] = createFilterSessionObj("max_time_filter", "Date", datesSelections)
    // all the filters concerning the sensors 
    for(var sensObj in OverallSensors) {
        var sensChecked = document.getElementById(OverallSensors[sensObj]['checkId']).checked
        var sensVal = OverallSensors[sensObj]['filterId']
        newFilterObj[OverallSensors[sensObj]['filterNameId']] = createFilterSessionObj(OverallSensors[sensObj]['name'], "Sensors", sensChecked, OverallSensors[sensObj]['id'])
    }
    for(var gasObj in OverallGases) {
        var gasChecked = document.getElementById(OverallGases[gasObj]['checkId']).checked 
        var gasVal = OverallGases[gasObj]['filterId']
        newFilterObj[OverallGases[gasObj]['filterNameId']] = createFilterSessionObj(OverallGases[gasObj]['name'], "Gases", gasChecked, OverallGases[gasObj]['id'])
    }
    for(var sessionObj in OverallSessions) {
        var sessionChecked = document.getElementById(OverallSessions[sessionObj]['checkId']).checked 
        var sessionVal = OverallSessions[sessionObj]['filterId']
        newFilterObj[OverallSessions[sessionObj]['filterNameId']] = createFilterSessionObj(OverallSessions[sessionObj]['name'], "Sessions", sessionChecked, OverallSessions[sessionObj]['id'])
    }
    // other options 
    newFilterObj['visualizationType'] = createFilterSessionObj("visualizationType", "FilterOptions", true)
    newFilterObj['show_median'] = createFilterSessionObj("show_median", "FilterOptions", document.getElementById('show_median_check').checked)
    newFilterObj['temperature_time_graph'] = createFilterSessionObj("temperature_time_graph", "FilterOptions", document.getElementById('temperature_time_graph_check').checked)
    newFilterObj['humidity_time_graph'] = createFilterSessionObj("humidity_time_graph", "FilterOptions", document.getElementById('humidity_time_graph_check').checked)
    newFilterObj['ppms_temperature_graph'] = createFilterSessionObj("ppms_temperature_graph", "FilterOptions", document.getElementById('ppms_temperature_graph_check').checked)
    newFilterObj['ppms_humidity_graph'] = createFilterSessionObj("ppms_humidity_graph", "FilterOptions", document.getElementById('ppms_humidity_graph_check').checked)
    var filterObjToJSON = JSON.stringify(newFilterObj)
    sessionStorage.setItem("filterOptions", filterObjToJSON)
    return filterObjToJSON
}
function initDateFilters(showView) {
    $.ajax({
        url: "/filters/date"
        , success: function(data) {
            var datesObj = JSON.parse(data)
            // getting the already stored filters 
            var filtersObj = getSessionStorageFilters()
            var minDateToApply = ''
            var maxDateToApply = ''
            var minTimeToApply = ''
            var maxTimeToApply = ''
            if(filtersObj != null) {
                console.log(filtersObj)
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
            if(showView == false) {
                return
            }
            $("#dashboardContent").hide()
            $("#filterSensorsSelection").hide()
            $("#filterGasesSelection").hide()
            $("#filterSessionsSelection").hide()
            $("#filterOptions").hide()
            $("#contextFiltersButtons").show()
            $("#filterDateSelection").fadeIn('slow')
            
        }
        , error: function(err) {
            console.log('an error occur retrieving range dates info:\n' + err)
        }
    })
}
function initSensorsFilters(showView) {
    $.ajax({
        url: "/filters/sensors"
        , success: function(data) {
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
                var checkId = sensorIdentifier + "_check"
                var currRowSens = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox" id="' + checkId + '"></td><td id="' + sensorIdentifier + '">' + sensObj[ind].name + '</td></tr>'
                sensObj[ind]['checkId'] = checkId
                sensObj[ind]['filterNameId'] = sensorIdentifier
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
            if(showView == false) {
                return
            }
            $("#dashboardContent").hide()
            $("#filterDateSelection").hide()
            $("#filterGasesSelection").hide()
            $("#filterSessionsSelection").hide()
            $("#filterOptions").hide()
            $("#contextFiltersButtons").show()
            $("#filterSensorsSelection").fadeIn('slow')
        }
        , error: function(err) {
            console.log('an error occur retrieving sensors info:\n' + err)
        }
    })
}
function initGasesFilters(showView) {
    $.ajax({
        url: "/filters/gases"
        , success: function(data) {
            var gasesObj = JSON.parse(data)
            var sessionFilters = getSessionStorageFilters()
            $("#gasesTable").empty()
            OverallGases = []
            // appending sensors to filters 
            for(var ind in gasesObj) {
                var gasIdentifier = gasesObj[ind].name + "_" + gasesObj[ind].id
                var checkId = gasIdentifier + "_check"
                var currRowGas = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox" id="' + checkId + '"></td><td id="' + gasIdentifier + '">' + gasesObj[ind].name + '</td></tr>'
                gasesObj[ind]['checkId'] = checkId
                gasesObj[ind]['filterNameId'] = gasIdentifier
                $('#gasesTable').append(currRowGas);
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
            if(showView == false) {
                return
            }
            // same starting and ending date 
            $("#dashboardContent").hide()
            $("#filterSensorsSelection").hide()
            $("#filterDateSelection").hide()
            $("#filterSessionsSelection").hide()
            $("#filterOptions").hide()
            $("#contextFiltersButtons").show()
            $("#filterGasesSelection").fadeIn('slow')
            
        }
        , error: function(err) {
            console.log('an error occur retrieving gases info:\n' + err)
        }
    })
}
function initSessionsFilters(showView) {
    $.ajax({
        url: "/filters/sessions"
        , success: function(data) {
            var sessionObj = JSON.parse(data)
            var sessionFilters = getSessionStorageFilters()
            OverallSessions = []
            console.log(sessionObj)
            $("#sessionsTable").empty()
            // appending sensors to filters 
            for(var ind in sessionObj) {
                var sessionIdentifier = sessionObj[ind].name + "_" + sessionObj[ind].id
                var checkId = sessionIdentifier + "_check"
                var currRowSession = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox" id="' + checkId + '"></td><td id="' + sessionIdentifier + '">' + sessionObj[ind].name + '</td></tr>'
                sessionObj[ind]['checkId'] = checkId
                sessionObj[ind]['filterNameId'] = sessionIdentifier
                $('#sessionsTable').append(currRowSession);
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
            if(showView == false) {
                return
            }
            $("#dashboardContent").hide()
            $("#filterSensorsSelection").hide()
            $("#filterGasesSelection").hide()
            $("#filterDateSelection").hide()
            $("#filterOptions").hide()
            $("#contextFiltersButtons").show()
            $("#filterSessionsSelection").fadeIn('slow')
            
        }
        , error: function(err) {
            console.log('an error occur retrieving gases info:\n' + err)
        }
    })
}
function initOptionsFilters(showView) {
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
    if(showView == false) {
        return
    }
    $("#dashboardContent").hide()
    $("#filterSensorsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterDateSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#contextFiltersButtons").show()
    $("#filterOptions").fadeIn('slow')
}
function initAllFilters() {
    initDateFilters(false)
    initSensorsFilters(false)
    initGasesFilters(false)
    initSessionsFilters(false)
    initOptionsFilters(false)
}
function backToDashboardContext() {
    $("#filterDateSelection").hide()
    $("#filterSensorsSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#dashboardContent").fadeIn('slow')
    $("#contextFiltersButtons").hide()
    $("#filterOptions").hide()
}
(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
        return false;
    });


    // Progress Bar
    $('.pg-bar').waypoint(function () {
        $('.progress .progress-bar').each(function () {
            $(this).css("width", $(this).attr("aria-valuenow") + '%');
        });
    }, {offset: '80%'});


    // Calender
    $('#calender').datetimepicker({
        inline: true,
        format: 'L'
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        items: 1,
        dots: true,
        loop: true,
        nav : false
    });


    // Chart Global Color
    Chart.defaults.color = "#6C7293";
    Chart.defaults.borderColor = "#000000";




    // Salse & Revenue Chart: NB this is just a prototype!
    var ctx2 = $("#salse-revenue").get(0).getContext("2d");
    var myChart2 = new Chart(ctx2, {
        type: "line",
        data: {
            labels: ["2016", "2017", "2018", "2019", "2020", "2021", "2022"],
            datasets: [
                {
                    label: "Revenue",
                    data: [99, 135, 170, 130, 190, 180, 270],
                    backgroundColor: "rgba(235, 22, 22, .5)",
                    fill: true
                }
            ]
            },
        options: {
            responsive: true
        }
    });

    $("#dateFilters").click(function() {
        initDateFilters(true)
    })
    $("#sensorsFilters").click(function() {
        initSensorsFilters(true)
    })
    $("#gasFilters").click(function() {
       initGasesFilters(true)    
    })
    $("#sessionFilters").click(function() {
        initSessionsFilters(true)
    })
    $("#optionsFilters").click(function() {
        initOptionsFilters(true)
    })
    $("#backBtn").click(function() {
        // TODO: eventual display of message of pending modifications 
        backToDashboardContext()
    })
    $("#saveBtn").click(function() {
        var newJSONFilters = setNewSessionStorageFilters()
        $.ajax({
            type: "POST",
            url: "/filters/allstored",
            data: newJSONFilters,
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                alert('Filters are successfully saved')
                backToDashboardContext()
            },
            error: function(err) {
                alert('During saving filters an error occur')
                console.log('error saving filters\n' + err)
            }
          });
    })
    $(document).ready(function() {
        $("#dashboardContent").show()
        $("#filterDateSelection").hide()
        $('#filterSensorsSelection').hide()
        $("#contextFiltersButtons").hide()
        $("#filterGasesSelection").hide()
        $("#filterSessionsSelection").hide()
        $("#filterOptions").hide()
        $.ajax({
            url: "/filters/allstored"
            , success: function(data) 
            { 
                // storing the string of session parameters 
                sessionStorage.setItem("filterOptions", data);
                console.log(JSON.parse(data))
                // initializing all the filters visualizations
                initAllFilters()
            }
            , error: function(err) {
                console.log(err)
            }
        })

    })
    
})(jQuery);


