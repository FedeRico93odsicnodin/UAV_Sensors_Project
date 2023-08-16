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
function createFilterSessionObj(filterID, filterContext, selected) {
    var newFilterOption = {}
    var selectedInt = 0
    if(selected) {
        selectedInt = 1
    }
    newFilterOption["selected"] = selectedInt 
    newFilterOption["filter_context"] = filterContext
    newFilterOption["filter_name"] = filterID 
    if(typeof(document.getElementById(filterID).value) != 'undefined')
        newFilterOption["filter_value"] = document.getElementById(filterID).value
    else 
        newFilterOption["filter_value"] = document.getElementById(filterID).innerHTML
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
        newFilterObj[OverallSensors[sensObj]['filterNameId']] = createFilterSessionObj(OverallSensors[sensObj]['filterNameId'], "Sensors", sensChecked)
    }
    // TODO: adding all the other filters options 
    var filterObjToJSON = JSON.stringify(newFilterObj)
    sessionStorage.setItem("filterOptions", filterObjToJSON)
    return filterObjToJSON
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
        // TODO: substitution with configuration server 
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
        
    })
    $("#sensorsFilters").click(function() {
        // TODO: substitution with configuration server 
        $.ajax({
            url: "/filters/sensors"
            , success: function(data) {
                OverallSensors = []
                var sensObj = JSON.parse(data)
                var sessionFilters = getSessionStorageFilters()
                $("#sensTable").empty()
                // appending sensors to filters 
                for(var ind in sensObj) {
                    var checked = true
                    var sensorIdentifier = sensObj[ind].name + "_" + sensObj[ind].id
                    if(sensorIdentifier in sessionFilters) {
                        if(sessionFilters[sensorIdentifier]["selected"] == "0") {
                            checked = false
                        }
                    }
                    var checkId = sensorIdentifier + "_check"
                    var currRowSens = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox" id="' + checkId + '" checked="' + checked + '"></td><td id="' + sensorIdentifier + '">' + sensObj[ind].name + '</td></tr>'
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
    })
    $("#gasFilters").click(function() {
        // TODO: substitution with configuration server 
        $.ajax({
            url: "/filters/gases"
            , success: function(data) {
                var gasesObj = JSON.parse(data)
                $("#gasesTable").empty()
                // appending sensors to filters 
                for(var ind in gasesObj) {
                    var currRowGas = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox"></td><td>' + gasesObj[ind].name + '</td></tr>'
                    $('#gasesTable').append(currRowGas);
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
        
    })
    $("#sessionFilters").click(function() {
        // TODO: substitution with configuration server 
        $.ajax({
            url: "/filters/sessions"
            , success: function(data) {
                var sessionObj = JSON.parse(data)
                $("#sessionsTable").empty()
                // appending sensors to filters 
                for(var ind in sessionObj) {
                    console.log(sessionObj[ind])
                    var currRowSession = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox"></td><td>' + sessionObj[ind].name + '</td></tr>'
                    $('#sessionsTable').append(currRowSession);
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
        
    })
    $("#optionsFilters").click(function() {
        $("#dashboardContent").hide()
        $("#filterSensorsSelection").hide()
        $("#filterGasesSelection").hide()
        $("#filterDateSelection").hide()
        $("#filterSessionsSelection").hide()
        $("#contextFiltersButtons").show()
        $("#filterOptions").fadeIn('slow')
    })
    $("#backBtn").click(function() {
        $("#filterDateSelection").hide()
        $("#filterSensorsSelection").hide()
        $("#filterSessionsSelection").hide()
        $("#filterGasesSelection").hide()
        $("#dashboardContent").fadeIn('slow')
        $("#contextFiltersButtons").hide()
        $("#filterOptions").hide()
    })
    $("#saveBtn").click(function() {
        var newJSONFilters = setNewSessionStorageFilters()
        $.ajax({
            type: "POST",
            url: "/filters/allstored",
            data: newJSONFilters,
            contentType: "application/json",
            dataType: 'json' 
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
            }
            , error: function(err) {
                console.log(err)
            }
        })

    })
    
})(jQuery);


