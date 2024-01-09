import datetime
from flask import Flask, render_template, request, url_for, jsonify
import os
import threading 
from multiprocessing import Process
import json
import configurator
import databaseServer
import processdatasensors
import MQCalib
import downloadModule
from flask import send_from_directory

fileUploadPath = ''

# starting work on final branch 
def initServer():
    global fileUploadPath
    # getting the current configuration from the xml file 
    serverDataObj = configurator.readConfiguration("serverConf.xml")
    # creation of the data folders for the file csv out and the database storage
    currDir = os.getcwd()
    outputCSVLocation = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    databaseLocation = os.path.join(currDir, serverDataObj.getProcessedDBFolder())
    savedCSVLocation = os.path.join(currDir, serverDataObj.getSavedCSVFolder())
    if(os.path.exists(databaseLocation) == False):
        os.mkdir(databaseLocation)
    if(os.path.exists(outputCSVLocation) == False):
        os.mkdir(outputCSVLocation)
    # creation of the folder in which moving the files 
    if(os.path.exists(savedCSVLocation) == False):
        os.mkdir(savedCSVLocation)
    fileUploadPath = outputCSVLocation
    databasePath = os.path.join(databaseLocation, serverDataObj.getDatabaseName())
    # database creation (if does not exist)
    databaseServer.createDatabase(databasePath)
    # MQ data calibration 
    app_mode = serverDataObj.getCurrRunMode()
    debug_ppm = serverDataObj.getDebugPPMCalculus()
    mqCalibPath = os.path.join(currDir, serverDataObj.getRefDocsFolder(), "MQCalib.csv")
    calibLoaded = MQCalib.loadCalib(mqCalibPath, app_mode, debug_ppm)
    if(calibLoaded == False):
        #print("no data has been loaded for the calibration, select CALIB as configuration for load those data")
        return
    # start thread for monitoring incoming uploads 
    uploadDetectionProcess = Process(target=processdatasensors.dataSensorsElaborateThread, args=(serverDataObj, ))
    uploadDetectionProcess.start()
    return serverDataObj

initServer()
app = Flask(__name__)

# used for checking if the server is available 
@app.route('/')
def testConnection():
    return render_template('index.html')
# POST request test 
@app.route('/tests/endpoint', methods=['POST'])
def endpoint():
    input_json = request.get_json(force=True) 
    # force=True, above, is necessary if another developer 
    # forgot to set the MIME type to 'application/json'
    #print('data from client:', input_json)
    dictToReturn = {'answer':42}
    return jsonify(dictToReturn)

# UPLOAD request test
@app.route('/CSV/upload', methods = ['GET', 'POST'])
def upload_file():
   global fileUploadPath
   if request.method == 'POST':
      #print('begin')
      f = request.files['upload']
      fileFinalPath = os.path.join(fileUploadPath, f.filename)
      f.save(fileFinalPath)
      #print('file ' + f.name + 'has been uploaded successfully')
      return 'file uploaded successfully'

# filters selections
@app.route('/filters/date', methods=['GET'])
def get_range_dates():
    minMaxDates = databaseServer.getRangeDate()
    res = json.dumps(minMaxDates)
    return res

@app.route('/filters/sensors', methods=['GET'])
def get_range_sensors():
    sensors = databaseServer.getSensorsDefinitions()
    objSensors = []
    for s in sensors:
        objSensors.append(sensors[s].sensorObj())
    res = json.dumps(objSensors)
    return res

@app.route('/filters/gases', methods=['GET'])
def get_range_gases():
    compounds = databaseServer.getCompoundsDefinitions()
    objCompounds = []
    for c in compounds:
        objCompounds.append(compounds[c].gasObj())
    res = json.dumps(objCompounds)
    return res
    

@app.route('/filters/sessions', methods=['GET'])
def get_range_sessions():
    allSessions = databaseServer.getAllSessions()
    objSessions = []
    for s in allSessions:
        objSessions.append(allSessions[s].sessionObj())
    res = json.dumps(objSessions)
    return res

@app.route('/filters/allstored', methods=['GET', 'POST'])
def get_all_stored_filters():
    if request.method == "POST":
        filtersJSON = request.get_json()
        filtersToInsert = []
        # getting the new filters config from the object 
        currFilterSel = filtersJSON['newFiltersConfig']
        currColorsSel = filtersJSON['gasColors']
        currSessionDatesModification = filtersJSON['modifiedDateSessions']
        # print(currFilterSel)
        # print(currSessionDatesModification)
        for f in currFilterSel:
            filtersToInsert.append(currFilterSel[f])
            if(currFilterSel[f]["filter_context"] == "Sensors"):
                if(currFilterSel[f]["adjustmentValue"] > 0):
                    # getting the id and the outlier lower bound for the regulation 
                    sensorId = currFilterSel[f]["filter_value"]
                    outlierLowerBound = currFilterSel[f]["adjustmentValue"] 
                    # calling the method for the regulation on current sensed data 
                    processdatasensors.regulateOutliersCurrSensor(sensorId, outlierLowerBound)
        databaseServer.insertFilterOptions(filtersToInsert)

        # verifying for the eventual update of the color for the visualized gas
        for c in currColorsSel:
            gasId = int(currColorsSel[c]['Id'])
            gasNewColor = str(currColorsSel[c]['color'])
            #print(str(gasId) + " - " + gasNewColor)
            databaseServer.updateGasColorDefinition(gasId, gasNewColor)

        # verifying the eventual update for the session date 
        for dt in currSessionDatesModification:
            # getting all parameters for the session and date modifications 
            sessionId = int(currSessionDatesModification[dt]['sessionId'])
            #modifiedDate = currSessionDatesModification[dt]['modifiedDate']
            #modifiedDateStr = currSessionDatesModification[dt]['modifiedDateStr']
            dateYear = currSessionDatesModification[dt]['dateYear']
            dateMonth = currSessionDatesModification[dt]['dateMonth']
            dateDay = currSessionDatesModification[dt]['dateDay']
            dateHour = currSessionDatesModification[dt]['dateHour']
            dateMinutes = currSessionDatesModification[dt]['dateMinutes']
            dateSeconds = currSessionDatesModification[dt]['dateSeconds']
            dateMillis = currSessionDatesModification[dt]['dateMillis']
            newDateForSession = datetime.datetime(
                dateYear
                ,dateMonth
                ,dateDay
                ,dateHour
                ,dateMinutes
                , dateSeconds
                , dateMillis)
            #print(modifiedDate)
            #print(str(sessionId) + " - " + modifiedDateStr)
            # print(newDateForSession)
            # modification for the current session
            databaseServer.updateDateSessionWithModifiedDate(sessionId, newDateForSession)
            # modification for all the points set for the current session
            databaseServer.alignPointsSessionWithModifiedDate(sessionId, newDateForSession)
        return json.dumps({'status': 'ok'})

        
    #print("GETTING FILTERS PHASE")
    allFilters = databaseServer.getExistingFilters()
    objFilters = {}
    for f in allFilters:
        if(allFilters[f].filter_context == 'Gases' or allFilters[f].filter_context == 'Sessions' or allFilters[f].filter_context == 'Sensors'):
            nameProp = allFilters[f].filter_name + "_" + str(allFilters[f].filter_value)
            objFilters[nameProp] = allFilters[f].filterObj()
            continue
        objFilters[allFilters[f].filter_name] = allFilters[f].filterObj()
    res = json.dumps(objFilters)
    #print(res)
    return res
# OLD METHOD: in this method ALL the points for the current gas are returned for the FE 
# NB: it was the FE to have the logic for session and calculation of all the different visualizations for the current session 
@app.route('/gasdata', methods=['POST'])
def get_gasdata_selected():
    gasInputs = request.get_json() 
    gasId = gasInputs["gasId"]
    gasName = gasInputs["gasName"]
    # verifying the selection as filter for the current substance 
    gasActivation = databaseServer.checkFilterActivatedOnGas(gasName, gasId)
    if(gasActivation == False):
        #print('the gas is not activated')
        return json.dumps({'status': gasName + ': gas not activated'})
    # verifying the activation of the respective sensor 
    sensorActivation = databaseServer.checkFilterActivateOnSensor(gasName, gasId)
    if(sensorActivation == False):
       #print('sensor is marked as not activated ' + str(gasName))
       return json.dumps({'status': gasName + ': sensor not activated'})
    # verifying presence of date filters 
    # activeDateFilters = databaseServer.getActiveDataFilters()
    # getting the data for the current gas TODO: implement date filters selection
    currGasData = databaseServer.getAllDataSensorsToDisplay(gasId)
    finalResult = {'status' : 'ok_' + gasName, 'gasData': currGasData, 'gasName': gasName, 'gasId': gasId}
    finalResultJSON = json.dumps(finalResult)
    return finalResultJSON
# OLD METHOD: reload for each of the substances (first version v1)
# same logic as the previous method but concerning the reload. AGAIN was the FE to decide how to manage all the points 
# returned by the BE 
@app.route('/gasdata_reload', methods=['POST'])
def get_gasdata_selected_reload():
    gasInputs = request.get_json() 
    gasId = gasInputs["gasId"]
    gasName = gasInputs["gasName"]
    upTime = gasInputs["upTime"]
    # verifying the selection as filter for the current substance 
    gasActivation = databaseServer.checkFilterActivatedOnGas(gasName, gasId)
    if(gasActivation == False):
        return json.dumps({'status': gasName + ': gas not activated'})
    # verifying the activation of the respective sensor 
    sensorActivation = databaseServer.checkFilterActivateOnSensor(gasName, gasId)
    if(sensorActivation == False):
       return json.dumps({'status': gasName + ': sensor not activated'})
    # verifying presence of date filters 
    activeDateFilters = databaseServer.getActiveDataFilters()
    # getting the data for the current gas TODO: implement date filters selection
    currGasData = databaseServer.getAllDataSensorsToDisplayReload(gasId, upTime)
    # currGasData = databaseServer.getAllDataSensorsToDisplay(gasId)
    finalResult = {'status' : 'ok_' + gasName, 'gasData': currGasData, 'gasName': gasName, 'gasId': gasId}
    #print(len(finalResult['gasData']))
    finalResultJSON = json.dumps(finalResult)
    return finalResultJSON
# OLD METHOD FOR RELOAD v2: a first refactoring of the previous method, which attempted to return all the points at the same time 
# for all the gases selected by the user 
@app.route('/gasdata_reload_v2', methods=['POST'])
def get_gasdata_selected_reload_v2():
    contentInput = request.get_json() 
    # print("GAS DATA RELOAD V2")
    finalResult = {}
    for gas in contentInput:
        # print(gas)
        # print(contentInput[gas]) 
        gasId = contentInput[gas]["gasId"]
        gasName = contentInput[gas]["gasName"]
        upTime = contentInput[gas]["upTime"]
        # verifying the selection as filter for the current substance 
        gasActivation = databaseServer.checkFilterActivatedOnGas(gasName, gasId)
        if(gasActivation == False):
            finalResult[gas] = { 'status': gasName + ': gas not activated'} 
        # verifying the activation of the respective sensor 
        sensorActivation = databaseServer.checkFilterActivateOnSensor(gasName, gasId)
        if(sensorActivation == False):
            finalResult[gas] = { 'status': gasName + ': gas not activated'} 
        currGasData = databaseServer.getAllDataSensorsToDisplayReload(gasId, upTime)
        finalResult[gas] = {'status' : 'ok_' + gasName, 'gasData': currGasData, 'gasName': gasName, 'gasId': gasId}
    finalResultJSON = json.dumps(finalResult)
    return finalResultJSON
# NEW LOAD METHOD: it is returned all the set of points to just display (no extra elaboration are required)
# this set is returned on basis of what it is contained in the filter table and in the table for the current graph visualization 
@app.route('/gasdata_load_new', methods=['POST'])
def gas_data_load_new():
    # getting all the substances for which product a visualization 
    objToVis = databaseServer.checkGasDashboardVisualization()
    # print(objToVis)
    finalResult = {}
    for currSub in objToVis:
        # print(currSub.gas_ref)
        # print(currSub.session_ref)
        # print(currSub.vis_type)
        # print(currSub.vis_granularity)
        # selection of the points for the current substance 
        processdatasensors.getPointsToVisualizeForSubstance(
            currSub.gas_ref, 
            currSub.session_ref, 
            currSub.vis_type, 
            currSub.vis_granularity)
    # TODO: 
    # 1) implementing in this way: returning an obj which maintains the information about the stored session (for visualizing the carousel rows)
    # 2) getting all the points for the ONLY visualized session in this case (the visualized information of the new created table)
    # 3) implementing extra methods information: 
    #   3.1 a method for checking if a just added graph for the current graph is visualized or not (in this case the visualization is disabled for incoming data)
    #   3.2 a method for updating the visualization when moving with respect to the carousel 
    #   3.3 a single POST method for getting the data on carousel movement and on bases of current visualization type 
    #   3.4 methods for updating the visualization entry on basis of the interval and the num of points selection 
    # 4) refactoring of FE for having this kind of approach and allowing the non block of all the logic 
    finalResultJSON = json.dumps(finalResult)
    return finalResultJSON
# NEW RELOAD METHOD: it is returned all the set of NEWER POINTS to just display (append) wrt the already displayed points 
# also this set is returned on basis of what it is contained in the filter table and in the table for the current graph visualization
@app.route('/gasdata_reload_new', methods=['POST'])
def gas_data_reload_new():
    print("implementation")
    return 
# DOWNLOAD all the dataset in xlsx format 
@app.route('/download_file', methods=['GET'])
def download_data_file():
    #print('trying to download file data')
    downloadModule.createXLSXFile("templates")
    return send_from_directory("templates", "SensorsData.xlsx"
    , as_attachment=True)