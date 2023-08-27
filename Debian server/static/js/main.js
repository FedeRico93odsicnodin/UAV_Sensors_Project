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
        isFilterContext = true
        initDateFilters(true)
    })
    $("#sensorsFilters").click(function() {
        isFilterContext = true
        initSensorsFilters(true)
    })
    $("#gasFilters").click(function() {
        isFilterContext = true
       initGasesFilters(true)    
    })
    $("#sessionFilters").click(function() {
        isFilterContext = true
        initSessionsFilters(true)
    })
    $("#optionsFilters").click(function() {
        isFilterContext = true
        initOptionsFilters(true)
    })
    $("#backBtn").click(function() {
        // TODO: eventual display of message of pending modifications 
        backToDashboardContext()
        isFilterContext = false
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
                isFilterContext = false
            },
            error: function(err) {
                alert('During saving filters an error occur')
                console.log('error saving filters\n' + err)
                backToDashboardContext()
                isFilterContext = false
            }
          });
    })
    $(document).ready(function() {
        // at the beginning i'm visualizing data 
        isFilterContext = false
        backToDashboardContext()
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
                // calling data reload 
                startUpdaterScript()
            }
            , error: function(err) {
                console.log(err)
            }
        })

    })
    
})(jQuery);