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
            url: "http://192.168.1.16:5000/filters/date"
            , success: function(data) {
                var datesObj = JSON.parse(data)
                // setting the range date for the current selection 
                var minDateParsed = parseDate(datesObj['minDate'][0])
                var maxDateParsed = parseDate(datesObj['maxDate'][0])
                $( ".date_picker" ).datepicker({
                    minDate: new Date(minDateParsed),
                    maxDate: new Date(maxDateParsed)
                });
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
                $("#dashboardContent").hide()
                $("#filterSensorsSelection").hide()
                $("#filterGasesSelection").hide()
                $("#filterSessionsSelection").hide()
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
            url: "http://192.168.1.16:5000/filters/sensors"
            , success: function(data) {
                var sensObj = JSON.parse(data)
                $("#sensTable").empty()
                // appending sensors to filters 
                for(var ind in sensObj) {
                    var currRowSens = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox"></td><td>' + sensObj[ind].name + '</td></tr>'
                    $('#sensTable').append(currRowSens);
                }
                $("#dashboardContent").hide()
                $("#filterDateSelection").hide()
                $("#filterGasesSelection").hide()
                $("#filterSessionsSelection").hide()
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
            url: "http://192.168.1.16:5000/filters/gases"
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
            url: "http://192.168.1.16:5000/filters/sessions"
            , success: function(data) {
                var sessionObj = JSON.parse(data)
                $("#sessionsTable").empty()
                // appending sensors to filters 
                for(var ind in sessionObj) {
                    console.log(sessionObj[ind])
                    var currRowSession = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox"></td><td>' + sessionObj[ind].name + '</td></tr>'
                    $('#sessionsTable').append(currRowSession);
                }
                // same starting and ending date 
                $("#dashboardContent").hide()
                $("#filterSensorsSelection").hide()
                $("#filterGasesSelection").hide()
                $("#filterDateSelection").hide()
                $("#contextFiltersButtons").show()
                $("#filterSessionsSelection").fadeIn('slow')
                
            }
            , error: function(err) {
                console.log('an error occur retrieving gases info:\n' + err)
            }
        })
        
    })

    $("#backBtn").click(function() {
        $("#filterDateSelection").hide()
        $("#filterSensorsSelection").hide()
        $("#dashboardContent").fadeIn('slow')
        $("#contextFiltersButtons").hide()
    })

    $(document).ready(function() {
        $("#dashboardContent").show()
        $("#filterDateSelection").hide()
        $('#filterSensorsSelection').hide()
        $("#contextFiltersButtons").hide()
        $("#filterGasesSelection").hide()
        $("#filterSessionsSelection").hide()
    })
    
})(jQuery);


