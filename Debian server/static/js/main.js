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
        $("#dashboardContent").hide()
        $("#filterSensorsSelection").hide()
        $("#filterGasesSelection").hide()
        $("#filterSessionsSelection").hide()
        $("#contextFiltersButtons").show()
        $("#filterDateSelection").fadeIn('slow')
    })
    $("#sensorsFilters").click(function() {
        // TODO: substitution with configuration server 
        $.ajax({
            url: "http://192.168.1.16:5000/filters/sensors"
            , success: function(data) {
                var sensObj = JSON.parse(data)
                $("#sensTable").empty()
                for(var ind in sensObj) {
                    var currRowSens = '<tr><td style="width:25px"><input class="form-check-input" type="checkbox"></td><td>' + sensObj[ind].name + '</td></tr>'
                    $('#sensTable').append(currRowSens);
                    $("#dashboardContent").hide()
                    $("#filterDateSelection").hide()
                    $("#filterGasesSelection").hide()
                    $("#filterSessionsSelection").hide()
                    $("#contextFiltersButtons").show()
                    $("#filterSensorsSelection").fadeIn('slow')
                }
            }
            , error: function(err) {
                console.log('an error occur retrieving sensors info:\n' + err)
            }
        })
        
    })
    $("#gasFilters").click(function() {
        $("#dashboardContent").hide()
        $("#filterSensorsSelection").hide()
        $("#filterDateSelection").hide()
        $("#filterSessionsSelection").hide()
        $("#contextFiltersButtons").show()
        $("#filterGasesSelection").fadeIn('slow')
    })
    $("#sessionFilters").click(function() {
        $("#dashboardContent").hide()
        $("#filterSensorsSelection").hide()
        $("#filterGasesSelection").hide()
        $("#filterDateSelection").hide()
        $("#contextFiltersButtons").show()
        $("#filterSessionsSelection").fadeIn('slow')
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


