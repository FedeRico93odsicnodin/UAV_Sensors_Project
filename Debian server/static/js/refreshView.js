// back to dashboard visualization
function backToDashboardContext() {
    $("#filterDateSelection").hide()
    $("#filterSensorsSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterOptions").hide()
    $("#contextFiltersButtons").hide()
    $("#dashboardContent").fadeIn('slow')
}
// date selection view
function showDateFiltersView() {
    $("#dashboardContent").hide()
    $("#filterSensorsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#filterOptions").hide()
    $("#contextFiltersButtons").show()
    $("#filterDateSelection").fadeIn('slow')
}
// sensors selection view
function showSensorsFiltersView() {
    $("#dashboardContent").hide()
    $("#filterDateSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#filterOptions").hide()
    $("#contextFiltersButtons").show()
    $("#filterSensorsSelection").fadeIn('slow')
}
// sessions selection view
function showSessionsFiltersView() {
    $("#dashboardContent").hide()
    $("#filterSensorsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterDateSelection").hide()
    $("#filterOptions").hide()
    $("#contextFiltersButtons").show()
    $("#filterSessionsSelection").fadeIn('slow')
}
// gases selection view
function showGasesFiltersView() {
    $("#dashboardContent").hide()
    $("#filterSensorsSelection").hide()
    $("#filterDateSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#filterOptions").hide()
    $("#contextFiltersButtons").show()
    $("#filterGasesSelection").fadeIn('slow')
}
// options selection view
function showOptionsFiltersView() {
    $("#dashboardContent").hide()
    $("#filterSensorsSelection").hide()
    $("#filterGasesSelection").hide()
    $("#filterDateSelection").hide()
    $("#filterSessionsSelection").hide()
    $("#contextFiltersButtons").show()
    $("#filterOptions").fadeIn('slow')
}
