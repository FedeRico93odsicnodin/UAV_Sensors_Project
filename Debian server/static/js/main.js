
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
// this function returns an array of time values of the date string format to be compared 
function parseTimeComplete(currDate) {
    var dateTimeParts = currDate.split(' ')
    var timeParts = dateTimeParts[1].split(':')
    var hour = timeParts[0]
    var minutes = timeParts[1]
    var seconds = timeParts[2]
    var secondsCleaned = seconds.split(".")
    seconds = secondsCleaned[0]
    return {"hh": hour, "mm": minutes, "ss": seconds}
}











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
    return dataDisplay
}
function createGasCanvas(gasName, gasNameId) {
    var htmlCanvas ='<div class="row" style="margin-top: 15px;">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div class="d-flex align-items-center justify-content-between mb-4">' +
                                    '<h6 class="mb-0">' + gasName + '</h6>' +
                                    '<select class="select" id="intervalDashboardSel">' +
                                        '<option value="ss">ss</option>' +
                                        '<option value="mm">mm</option>' +
                                        '<option value="hh">hh</option>' +
                                        '<option value="d">d</option>' +
                                        '<option value="w">w</option>' +
                                        '<option value="m">m</option>' +
                                    '</select>' +
                                '</div>' +
                                '<canvas id="' + gasNameId + '"></canvas>' +
                            '</div>' +
                        '</div>'
                    '</div>'
    return htmlCanvas
}
function loadDashboardData() {
    console.log('starting loading dashboard data')
    var gasTest = {"gasId": 3, "gasName": "CH4"}
    var allGasesToRetrieve = getGasesToDisplay()
    $('#dashboardContent').empty()
    console.log(allGasesToRetrieve)
    for(var currGas in allGasesToRetrieve) {
        $.ajax({
            type: "POST",
            url: "/gasdata",
            data: JSON.stringify(allGasesToRetrieve[currGas]),
            contentType: "application/json",
            dataType: 'json',
            success: function(data) {
                if(data['status'].startsWith("ok_") == false) {
                    console.log("nothing to display")
                    return 
                }
                // preparation of the canvas for the current substance 
                var gasNameId = data['gasName'] + "_" + data['gasId']
                var htmlCanvasAppend = createGasCanvas(data['gasName'], gasNameId)
                var dataDisplay = getDataToDisplaySS(data)
                if(dataDisplay['data'].length == 0) {
                    console.log("nothing to display")
                    return 
                }
                console.log(dataDisplay['labels'])
                $('#dashboardContent').append(htmlCanvasAppend)
                // Salse & Revenue Chart: NB this is just a prototype!
                var ctx2 = $("#" + gasNameId).get(0).getContext("2d");
                var myChart2 = new Chart(ctx2, {
                    type: "line",
                    options: {
                        tension: 1,
                    },
                    data: {
                        labels: dataDisplay['labels'],
                        datasets: [
                            {
                                label: data['gasName'],
                                data: dataDisplay['data'],
                                backgroundColor: "rgba(235, 22, 22, .5)",
                                fill: true
                            }
                        ]
                        },
                    options: {
                        responsive: true
                    }
                });
            },
            error: function(err) {
                alert('During saving filters an error occur')
                console.log('error saving filters\n' + err)
            }
          });
    }
    
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
                initLoadedFiltersMatrix()
                initAllFilters()
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
                // resetting loaded filters markers 
                initLoadedFiltersMatrix()
                // storing the string of session parameters 
                sessionStorage.setItem("filterOptions", data);
                // initializing all the filters visualizations
                initAllFilters()
            }
            , error: function(err) {
                console.log(err)
            }
        })

    })
    
})(jQuery);


