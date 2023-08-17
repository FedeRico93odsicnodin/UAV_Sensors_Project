function setNewIntervalGraph(sel, gasNameId) {
    console.log(sel)
    console.log(gasNameId)
}
function setNewPointNumberGraph(sel, gasNameId) {
    console.log(sel)
    console.log(gasNameId, gasNameId)
}
// html for rendering single canvas gas visualizer
function createGasCanvas(gasName, gasNameId) {
    // rendered html 
    var selTimeInterval = 'intervalDashboardSel' + gasNameId
    var selPointsInterval = 'pointsIntervalSel_' + gasNameId
    var htmlCanvas ='<div class="row" style="margin-top: 15px;">' +  
                        '<div class="col-sm-24 col-xl-10 mx-auto">' + 
                            '<div class="bg-secondary text-center rounded p-4">' +
                                '<div>' +
                                    '<h6 class="mb-0" style="float:left">' + gasName + '</h6>' +
                                    '<select class="select" style="float:right" id="' + selTimeInterval + '" onchange="setNewIntervalGraph(this);">' +
                                        '<option value="ss">ss</option>' +
                                        '<option value="mm">mm</option>' +
                                        '<option value="hh">hh</option>' +
                                        '<option value="d">d</option>' +
                                        '<option value="w">w</option>' +
                                        '<option value="m">m</option>' +
                                    '</select>' +
                                    '<select class="select" style="float:right;margin-right:10px" id="' + selPointsInterval + '" onchange="setNewPointNumberGraph(this);">' +
                                        '<option value="5">5</option>' +
                                        '<option value="10">10</option>' +
                                        '<option value="25">25</option>' +
                                        '<option value="50">50</option>' +
                                        '<option value="100">100</option>' +
                                        '<option value="all">all</option>' +
                                    '</select>' +
                                '</div>' +
                                '<canvas id="' + gasNameId + '"></canvas>' +
                            '</div>' +
                        '</div>'
                    '</div>'
    return htmlCanvas
}
// iteration for rendering the selected filtered substances
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
