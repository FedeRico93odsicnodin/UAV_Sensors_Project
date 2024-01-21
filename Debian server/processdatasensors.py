#
# Module for the post processing of data 
# population of the sensors and sessions tables before 
# post process of content data sensors 
# persistance of the information on DB
#
# standard modules 
import os 
import time 
from datetime import datetime 
import csv
# custom modules 
import dbmodels
import databaseServer
import MQCalib

# runtime analysis parameters
# indexed list of all header data 
csvheader = []
# useful parameters for the MQ sensors calibration
scdParams = {}
# session column index 
sessionCol = 0
# currently saved gases characteristics
initGasesData = {} 
# currently saved sensors characteristics
initSensorsData = {}
# current session for the CSV
currSession = {}

# getting the file name from its initial path 
def getFileName(pathFile):
    pathParts = pathFile.split("/")
    pathPartsLastPos = len(pathParts) - 1
    fileName = pathParts[pathPartsLastPos]
    #print(fileName)
    return fileName

def dataSensorsElaborateThread(serverDataObj):
    currDir = os.getcwd()
    outputCSVFolder = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    waitingProcessTime = serverDataObj.getWaitingProcessTime()
    global initGasesData
    global initSensorsData
    global currSession
    global scdParams
    # folder in which save iterated CSVs
    currSavedCSVFolder = os.path.join(currDir, serverDataObj.getSavedCSVFolder())
    while(True):
        currSession = None
        orderedFilesToProcess = []
        pendingCSVFiles = os.listdir(outputCSVFolder)
        if(len(pendingCSVFiles) == 0):
            #print('waiting for files')
            # verify if values to update for resistances R0
            updateR0Values()
            time.sleep(waitingProcessTime)
        for fileCSV in pendingCSVFiles:
            currFileDate = getFileDate(fileCSV)
            orderedFilesToProcess = addFileRefToDictionary(fileCSV, currFileDate, orderedFilesToProcess)
        while(len(orderedFilesToProcess) > 0):
            fileName = orderedFilesToProcess[0]["fileName"]
            #print('processing file ' + fileName)
            filePath = os.path.join(outputCSVFolder, fileName)
            with open(filePath, 'r', encoding='utf-8') as f:
                print(filePath)
                #csvdata = csv.reader(f)
                csvdata = csv.reader(
                    (row.replace('\0', '').replace('\x00', '') for row in f),
                    delimiter=','
                )
                # getting the first header definition on the first csv row 
                csvheader = initGasesAndSensors(csvdata)
                # print(csvheader)
                # getting the SCD columns params for calibration
                scdParams = initSCDParametersCalibration(csvheader)
                # getting the session header column index 
                sessionCol = initSessionColIndex(csvheader)
                # checking if need to add initial or extra gases to current analysis 
                initGasesData = checkIfNewGasesToAdd(csvheader, initGasesData)
                # checking if need to add initial or extra sensors to current analysis 
                initSensorsData = checkIfNewSensorsToAdd(csvheader, initSensorsData, initGasesData)
                # prepare and store current data values
                beginProcessSensorsData(csvdata, csvheader, sessionCol)
                print('file sensors rows has been added to DB')
                # inserting values for the current visualized graphs for all the substances and the current session 
                insertDashboardFirstVisualized()
            # deletion of file
            orderedFilesToProcess.remove(orderedFilesToProcess[0])
            # moving the file to the backup location 
            fileName = getFileName(filePath)
            fileNewDest = os.path.join(currSavedCSVFolder, fileName)
            os.rename(filePath, fileNewDest)
            #print('file ' + fileName + "has been moved in " + fileNewDest)
            time.sleep(0.25)

def dataSnesorsElaborateThreadTEST(refCSVPath):
    global initGasesData
    global initSensorsData
    global currSession
    currSession = None
    with open(refCSVPath, 'r') as f:
        csvdata = csv.reader(f)
        # getting the first header definition on the first csv row 
        #print('\n')
        csvheader = initGasesAndSensors(csvdata)
        print('STEP1: csv header parameter:')
        print(csvheader)
        # getting the SCD columns params for calibration
        print('\n')
        scdParams = initSCDParametersCalibration(csvheader)
        print('STEP2: scd parameters for calibration:')
        print(scdParams)
        # getting the session header column index 
        print('\n')
        sessionCol = initSessionColIndex(csvheader)
        print('STEP3: session col index')
        # checking if need to add initial or extra gases to current analysis 
        print('\n')
        initGasesData = checkIfNewGasesToAdd(csvheader, initGasesData)
        print('STEP4: current gases')
        print(initGasesData)
        # checking if need to add initial or extra sensors to current analysis 
        print('\n')
        initSensorsData = checkIfNewSensorsToAdd(csvheader, initSensorsData, initGasesData)
        print('STEP5: current sensors')
        print(initSensorsData)
        # prepare and store current data values
        beginProcessSensorsData(csvdata, csvheader)

def getFileDate(filePath):
    fileNameParts = filePath.split("_")
    fileYear = int(fileNameParts[0])
    fileMonth = int(fileNameParts[1])
    fileDay = int(fileNameParts[2])
    fileHour = int(fileNameParts[3])
    fileMinutes = int(fileNameParts[4])
    fileSeconds = int(fileNameParts[5])
    fileMillisicends = int(fileNameParts[6])
    fileDateTime = datetime(fileYear, fileMonth, fileDay, fileHour, fileMinutes, fileSeconds, fileMillisicends)
    return fileDateTime

def addFileRefToDictionary(currFilePath, currFileDate, orderedFilesToUpload):
    if(len(orderedFilesToUpload) == 0):
        orderedFilesToUpload.append({ "fileName": currFilePath, "filedate": currFileDate})
        return orderedFilesToUpload
    inserted = False
    for indFile, listFilePath in enumerate(orderedFilesToUpload):
        if(listFilePath["filedate"] > currFileDate):
            orderedFilesToUpload.insert(indFile, { "fileName": currFilePath, "filedate": currFileDate})
            inserted = True
            break
            
    if(inserted == False):
        orderedFilesToUpload.append({ "fileName": currFilePath, "filedate": currFileDate})
    return orderedFilesToUpload

def initGasesAndSensors(rowHeader):
    # selection of the first row 
    for rowH in rowHeader:
        # the list of the retrieved values 
        retrievedStartInfo = []
        for colHeader in rowH:
            # way for identifying timestamp column 
            if(colHeader.startswith('TS')):
                colHeaderParts = colHeader.split('|')
                tsValue = {
                    "gas": "TS",
                    "sensor" : str(colHeaderParts[1]).replace(' ', 'e'),
                    "sensorDescr" : "nd"
                }
                retrievedStartInfo.append(tsValue)
                continue
            # identification of compound and relative sensor
            colHeaderParts = colHeader.split('|')
            if(len(colHeaderParts) != 3):
                otherVal = {
                    "gas": "other",
                    "sensor" : str(colHeader).replace(' ', 'e'),
                    "sensorDescr" : "nd"
                }
                retrievedStartInfo.append(otherVal)
                continue
            
            currColValues = {
                "gas": str(colHeaderParts[0]).replace(' ', 'e')
                , "sensor": str(colHeaderParts[1]).replace(' ', 'e')
                , "sensorDescr": colHeaderParts[2]}
            retrievedStartInfo.append(currColValues)
        break
    return retrievedStartInfo

def initSCDParametersCalibration(csvHeader):
    scdMarkers = {}
    idx = 0
    for csvH in csvHeader:
        if csvH['sensor'] == 'SCD41' and csvH['gas'] == "C":
            scdMarkers['temperature_colindex'] = idx
        if csvH['sensor'] == 'SCD41' and csvH['gas'] == 'RH':
            scdMarkers['RH_colindex'] = idx
        idx = idx + 1
    return scdMarkers

def initSessionColIndex(rowHeader):
    sessionColHeader = 0
    idx = 0
    for csvH in rowHeader:
        if csvH['gas'] != 'other': 
            idx = idx + 1
            continue
        if csvH['sensor'] != 'Session': 
            idx = idx + 1
            continue
        sessionColHeader = idx
        idx = idx + 1
    return idx - 1

def checkIfNewGasesToAdd(rowHeader, prevStoredGases):
    # data still not initiliazed with previous info
    if(len(prevStoredGases) == 0):
        prevStoredGases = databaseServer.getCompoundsDefinitions()
    allNewCompoundsInCSV = []
    for sensorHeaderCol in rowHeader:
        if sensorHeaderCol['gas'] in prevStoredGases.keys():
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        # by default the color for the gas is the standard of the chart.js definition
        allNewCompoundsInCSV.append((None, str(sensorHeaderCol['gas']).replace(' ', '_'), '235,22,22'))
    if(len(allNewCompoundsInCSV) > 0):
        databaseServer.insertCompoundsData(allNewCompoundsInCSV)
        prevStoredGases = databaseServer.getCompoundsDefinitions()
        #print(prevStoredGases)

    return prevStoredGases

def checkIfNewSensorsToAdd(rowHeader, prevStoredSensors, checkedStoredGases):
    if(len(prevStoredSensors) == 0):
        prevStoredSensors = databaseServer.getSensorsDefinitions()
    allNewSensorsInCSV = []
    for sensorHeaderCol in rowHeader:
        if(sensorHeaderCol['sensor'] in prevStoredSensors.keys()):
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        # getting the information to persist for current row
        sensorName = sensorHeaderCol['sensor']
        sensorDescription = sensorHeaderCol['sensorDescr']
        #print(sensorHeaderCol['gas'])
        refGasID = checkedStoredGases[sensorHeaderCol['gas']].id
        allNewSensorsInCSV.append((None, str(sensorName).replace(' ', 'e'), sensorDescription, refGasID))
    if(len(allNewSensorsInCSV) > 0):
        databaseServer.insertSensorsData(allNewSensorsInCSV)
        prevStoredSensors = databaseServer.getSensorsDefinitions()
    return prevStoredSensors
 
def beginProcessSensorsData(csvdata, csvHeader, sessionCol):
    idx = 0
    print(csvdata)
    for sensorData in csvdata:
        # data of the already analyzed header
        if(idx == 0): 
            idx = idx + 1
            continue
        # initializing the session
        if(idx == 1): 
            currSession = checkSessionDB(sensorData, sessionCol)
            idx = idx + 1
        if(len(sensorData) < len(csvHeader)):
            continue
        # processing sensor data row
        processSensorsDataRow(sensorData, csvHeader, currSession)

def checkSessionDB(sensorData, sessionCol):
    global currSession
    dateStampFormat = '%Y-%m-%d %H:%M:%S.%f'
    currSessionDatestamp = sensorData[sessionCol] + '.000'
    currSessionDate = datetime.strptime(currSessionDatestamp, dateStampFormat)
    currSessionName = 'session started in ' + currSessionDatestamp
    currSessionObj = databaseServer.getSensorCurrSession(currSessionName)
    if(currSessionObj == None):
        databaseServer.addNewSessionValue(currSessionName, currSessionDate)
        currSessionObj = databaseServer.getSensorCurrSession(currSessionName)
        insertSessionFilterAsSelected(currSessionObj)
        #print('session added')
    currSession = currSessionObj
    return currSession

def insertSessionFilterAsSelected(currSessionObj):
    filterObj = {}
    filterObj['filter_context'] = 'Sessions'
    filterObj['filter_name'] = currSessionObj.name
    filterObj['filter_value'] = currSessionObj.id
    filterObj['selected'] = 1
    filterObjs = []
    filterObjs.append(filterObj)
    databaseServer.insertFilterOptions(filterObjs, False)
    #print("filter inserted")

def processSensorsDataRow(sensorDataRow, csvHeader, currSession):
    global initSensorsData
    # date formats 
    dateStampFormat = '%Y-%m-%d %H:%M:%S.%f'
    # analysis start from the retrieved CSV header 
    arduinoTimestamp = datetime(1, 1, 1, 0, 0)
    raspberryTimestamp = datetime(1, 1, 1, 0, 0)
    sensedValue = 0
    sensorRefId = 0
    gasRefId = 0
    sessionRefId = 0
    toInsertValues = []
    idxCsv = 0
    # all row analysis
    for csvContent in csvHeader:
        #print(csvContent['gas'] + "|" + csvContent['sensor'])
        #print(str(idxCsv) + " - " + sensorDataRow[idxCsv])
        if(trackNotAnalyzedColumn(csvContent)):
            idxCsv = idxCsv + 1
            continue
        # definition of other parameters not to persist as data sensors 
        if(csvContent['gas'] == 'other'):
            idxCsv = idxCsv + 1
            continue
        # definition for the timestamps of the current row 
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == '(Arduino)':
            arduinoTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
            idxCsv = idxCsv + 1
            continue
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == '(Overall)':
            raspberryTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
            #print(raspberryTimestamp)
            idxCsv = idxCsv + 1
            continue
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == '(Rpi)':
            # continuing on rpi time 
            idxCsv = idxCsv + 1
            continue
        if csvContent['gas'] == 'SCDtime':
            idxCsv = idxCsv + 1
            continue
        # sensed value 
        # getting the values of T and RH of current row for calib
        sensorRefId = initSensorsData[csvContent['sensor']].id
        objCalib = getCurrentParamsForCalib(sensorDataRow)
        sensedValue = processSensorData(sensorRefId, csvContent, sensorDataRow[idxCsv], objCalib)
        gasRefId = initGasesData[csvContent['gas']].id
        sessionRefId = currSession.id
        # obj creation 
        currSensorObj = dbmodels.SensorDataObj()
        # NB: application of the same timestamp for data coherence
        if(isArduinoSensor(csvContent['sensor'])):
            currSensorObj.date = raspberryTimestamp
        else:
            currSensorObj.date = raspberryTimestamp
        currSensorObj.detected_substance_id = gasRefId
        currSensorObj.detected_substance_val = sensedValue
        currSensorObj.sensor_id = sensorRefId
        currSensorObj.session_ref = sessionRefId
        toInsertValues.append(currSensorObj)
        idxCsv = idxCsv + 1
        
    # insert values to db 
    databaseServer.insertDataSensor(toInsertValues)

# getting the current RH and T values for the sensed row
def getCurrentParamsForCalib(sensorDataRow):
    global scdParams
    # getting the start values for the Temperature and RH factor 
    TVal = MQCalib.Calib_start_params['TVal']
    RHVal = MQCalib.Calib_start_params['RHVal']
    T_idx = scdParams['temperature_colindex']
    RH_idx = scdParams['RH_colindex']
    if(sensorDataRow[T_idx] != ''):
        TVal = float(sensorDataRow[T_idx])
    if(sensorDataRow[RH_idx] != ''):
        RHVal = float(sensorDataRow[RH_idx])
    calibObj = { 'TVal': TVal, 'RHVal': RHVal}
    return calibObj
# getting if the sensor is managed by Arduino
def isArduinoSensor(sensorName):
    isMQ = False
    if(sensorName == 'MQ4'):
        isMQ = True
    if(sensorName == 'MQ7'):
        isMQ = True
    if(sensorName == 'MQ5'):
        isMQ = True
    if(sensorName == 'MQ3'):
        isMQ = True
    if(sensorName == 'MQ135'):
        isMQ = True
    if(sensorName == 'MQ2'):
        isMQ = True
    return isMQ

def trackNotAnalyzedColumn(colDefinition):
     if(colDefinition['gas'] == 'SCDtime'):
         return True
     if(colDefinition['gas'] == 'ticksC'):
         return True
     if(colDefinition['gas'] == 'ticksRH'):
         return True
     if(colDefinition['sensor'] == 'Session'):
         return True
     return False
        
def processSensorData(sensorId, sensorDefinition, sensorValue, calibObj):
    # application mode: for the eventual calibration of MQ sensor and the current phase
    global application_mode
    sensedValue = 0
    # print(sensorDefinition)
    # print(sensorValue)
    if(sensorValue != ''):
        sensedValue = float(sensorValue)
    currT = calibObj['TVal']
    currRH = calibObj['RHVal']
    # calibration for the MQ sensors 
    if(sensorDefinition['sensor'] == 'MQ4'
       or sensorDefinition['sensor'] == 'MQ7'
       or sensorDefinition['sensor'] == 'MQ5'
       or sensorDefinition['sensor'] == 'MQ3'
       or sensorDefinition['sensor'] == 'MQ135'
       or sensorDefinition['sensor'] == 'MQ2'):
        # deactivating the calculation process
        return sensedValue
        # sensedValue = MQCalib.getPPMValue(
        #    sensorValue, 
        #    sensorId, 
        #    sensorDefinition['sensor'], 
        #    currT, 
        #    currRH)
    return sensedValue
    
def updateR0Values():
    global initSensorsData
    num = 0
    for currSensor in MQCalib.R0_values:
        num = num + 1
        sensorId = initSensorsData[currSensor].id
        resVal = MQCalib.R0_values[currSensor]
        databaseServer.update_rzero_value(sensorId, resVal)
    #if(num > 0):
    #    print('updated ' + str(num) + ' R0s values')
        
# method for version V1
# allow the regulation of the outliers imposed on a particular sensor 
def regulateOutliersCurrSensor(sensorId, outlierLowerBound):
    # getting all the outliers for the current sensor 
    outliersForSensor = databaseServer.getAllOutliersFromLowerLimitForSensor(sensorId, outlierLowerBound)
    # print(outliersForSensor)
    for outlier in outliersForSensor:
        outlierId = outlier["id"]
        # print(outlierId)
        # getting the nearest min and the nearest max for the current outlier 
        outlierNearestLow = databaseServer.getNearestValueToOutlierLower(sensorId, outlierId)
        outlierNearestUp = databaseServer.getNearestValueToOutlierUpper(sensorId, outlierId)
        # print(outlierNearestLow)
        # print(outlierNearestUp)
        # calculating the medium of the two nearest values 
        medVal = 0
        if(outlierNearestLow == None and outlierNearestUp == None):
            medVal = outlier["sensedVal"]
        if(outlierNearestUp == None):
            medVal = outlierNearestLow["sensedValue"]
        if(outlierNearestLow == None):
            medVal = outlierNearestUp["sensedValue"]
        else:
            medVal = (outlierNearestLow["sensedValue"] + outlierNearestUp["sensedValue"]) / 2
        # print(medVal)
        # updating the outlier with the averaged value 
        databaseServer.updateOutlierValue(outlierId, medVal)

# inserting for the first time the complete visualization for the dashboard 
# the current session and the current substance 
def insertDashboardFirstVisualized():
    global initGasesData
    global currSession
    for currGas in initGasesData:
        currGasId = initGasesData[currGas].id
        sessionId = currSession.id
        isDashboardPresent = databaseServer.checkInfoCurrVisualizationPresence(sessionId, currGasId)
        if(isDashboardPresent == True):
            continue
        # preparation of the first graph visualization to insert 
        graphVisObj = dbmodels.DashboardCurrVisualzed()
        graphVisObj.session_ref = sessionId
        graphVisObj.gas_ref = currGasId
        # when -1 all the points are visualized 
        graphVisObj.vis_type = -1
        # default selection for the granularity is at mmm step
        graphVisObj.vis_granularity = "mmm"
        # this graph is selected as first instance 
        graphVisObj.is_visualized = 1
        databaseServer.insertCurrGasGraphVisualDefinition(graphVisObj)
# method to format the new points for the current view
def formatElaboratedPointsForView(pointsSet):
    returnedPointsForVis = {}
    # set of labels and data to visualize for the current selected visualization 
    returnedPointsForVis = {}
    # array with all the set of labels 
    arrLabels = []
    # array with all the set of values 
    arrValues = []
    lenIndex = 0
    for currObjGas in pointsSet:
        # date label
        arrLabels.append(currObjGas[0])
        # gas value 
        arrValues.append(currObjGas[1])
        lenIndex = lenIndex + 1
    returnedPointsForVis["labels"] = arrLabels
    returnedPointsForVis["values"] = arrValues
    returnedPointsForVis["lenInd"] = lenIndex
    # getting the gas current session name 
    returnedPointsForVis["sessionName"] = pointsSet[0][2]
    return returnedPointsForVis

# getting the current points of visualization for the current substance 
def getPointsToVisualizeForSubstance(gasId, sessionId, vis_type, vis_granularity, datetimeUp = None):
    # set of labels and data to visualize for the current selected visualization 
    returnedPointsForVis = {}
    # array with all the set of labels 
    arrLabels = []
    # array with all the set of values 
    arrValues = []
    # current session gas name 
    currSessionName = ""
    # getting all the points for the current visualization 
    if(datetimeUp == None):
        # for the case in which the mmm interval is selected 
        if(vis_granularity == "mmm"):
            allPointsSet = databaseServer.getAllPointsToVisualize(gasId, sessionId, vis_type)
            # print(allPointsSet)
            returnedPointsForVis = formatElaboratedPointsForView(allPointsSet)
            # if the vis type for the numbered points is not all the set, have to get all the points for the current set 
            if(vis_type > 0):
                allPointsCurrVis = databaseServer.getOverallNumberOfPointsForCurrGranularity(gasId, sessionId, vis_granularity)
                returnedPointsForVis["lenInd"] = allPointsCurrVis
            # print(returnedPointsForVis)
            return returnedPointsForVis
        # attempting to get all the points for the current vis granularity 
        allPointsSet = databaseServer.getAllPointsToVisualizeDiffGranularity(gasId, sessionId, vis_type, vis_granularity)
        # if the length of the current set is = 0, then I have to calculate and persisting all the set before retrieving 
        # the desired set 
        if(len(allPointsSet) == 0):
            lenIndex = 0
            # getting again all the point for the current set to visualize: NB the visualization must be on all the available set 
            allPointsSet = databaseServer.getAllPointsToVisualize(gasId, sessionId, -1)
            # getting the current session name 
            currSessionName = allPointsSet[0][2]
            allPointsSetToReturn = []
            currDate = None 
            # the set of all final points to persist for the selected visualization 
            newSetPointsForSelectedGranularity = []
            for point in allPointsSet:
                # print(point[0])
                # currPointReadDate = point["dateread"]
                # print(currPointReadDate)
                date_str = point[0]
                # 2023-12-07 10:41:22.669000
                date_format = '%Y-%m-%d %H:%M:%S'
                if(date_str[-7] == "."):
                    date_format = '%Y-%m-%d %H:%M:%S.%f'
                date_obj = datetime.strptime(date_str, date_format)
                # print(date_obj)
                # print(date_obj.hour)
                if(currDate == None): 
                    currDate = date_obj
                    # creation of the new first point to add 
                    newPointToAdd = createNewGranularityPoint(point, sessionId, gasId, vis_granularity)
                    # appending the point to the different lists to get 
                    allPointsSetToReturn.append(newPointToAdd)
                    newSetPointsForSelectedGranularity.append((
                            None,
                            newPointToAdd["dateread"],
                            newPointToAdd["gasId"],
                            newPointToAdd["value"],
                            newPointToAdd["gasId"],
                            newPointToAdd["sessionId"],
                            vis_granularity,
                            newPointToAdd["date"]
                        ))
                    arrLabels.append(newPointToAdd["date"])
                    arrValues.append(newPointToAdd["value"])
                    lenIndex = lenIndex + 1
                    continue
                majorDate = (date_obj > currDate)
                if(majorDate):
                   # calculating the point to insert on basis of current visualization 
                    newDateVis = None
                    prevDateVis = None 
                    completingTime = None
                    if(vis_granularity == "ss"):
                        newDateVis = date_obj.second
                        prevDateVis = currDate.second
                        if(date_obj.hour < 10):
                            completingTime = "0" + str(date_obj.hour)
                        else :
                            completingTime = str(date_obj.hour)
                        if(date_obj.minute < 10): 
                            competingTime = completingTime  + ":0" + str(date_obj.minute) 
                        else: 
                            completingTime = completingTime + ":" + str(date_obj.minute)
                    if(vis_granularity == "mm"):
                        newDateVis = date_obj.minute
                        prevDateVis = currDate.minute
                        if(date_obj.hour < 10):
                            completingTime = "0" + str(date_obj.hour)
                        else :
                            completingTime = str(date_obj.hour)
                    if(vis_granularity == "hh"):
                        newDateVis = date_obj.hour 
                        prevDateVis = currDate.hour

                    # the selected interval effectively changed for the current visualization  
                    if(newDateVis != prevDateVis):
                         # appending the point to the different lists to get 
                        newPointToAdd = createNewGranularityPoint(point, sessionId, gasId, vis_granularity)
                        allPointsSetToReturn.append(newPointToAdd)
                        newSetPointsForSelectedGranularity.append((
                                None,
                                newPointToAdd["dateread"],
                                newPointToAdd["gasId"],
                                newPointToAdd["value"],
                                newPointToAdd["gasId"],
                                newPointToAdd["sessionId"],
                                vis_granularity,
                                newPointToAdd["date"]
                            ))
                        arrLabels.append(newPointToAdd["date"])
                        arrValues.append(newPointToAdd["value"])
                        lenIndex = lenIndex + 1
                currDate = date_obj
            # constructing the object of all visualized points 
            returnedPointsForVis["labels"] = arrLabels
            returnedPointsForVis["values"] = arrValues
            returnedPointsForVis["lenInd"] = lenIndex
            returnedPointsForVis["sessionName"] = currSessionName
            databaseServer.insertNewPointsForDifferentVisualization(newSetPointsForSelectedGranularity)
            return returnedPointsForVis
        else:
            returnedPointsForVis = formatElaboratedPointsForView(allPointsSet)
            # if the vis type for the numbered points is not all the set, have to get all the points for the current set 
            if(vis_type > 0):
                allPointsCurrVis = databaseServer.getOverallNumberOfPointsForCurrGranularity(gasId, sessionId, vis_granularity)
                returnedPointsForVis["lenInd"] = allPointsCurrVis
        # returning the already present points for the selected set and the given gas, interval and session 
        return returnedPointsForVis
# creation for the new point to visualized based on the granularity 
def createNewGranularityPoint(point, sessionId, gasId, vis_granularity):
    # creation for the new date to compare wrt the previous one 
    date_str = point[0]
    # 2023-12-07 10:41:22.669000
    date_format = '%Y-%m-%d %H:%M:%S'
    if(date_str[-7] == "."):
        date_format = '%Y-%m-%d %H:%M:%S.%f'
    date_obj = datetime.strptime(date_str, date_format)
    newDateVis = date_obj.second
    labelToShow = None
    if(vis_granularity == "ss"):
        if(date_obj.hour < 10):
            completingTime = "0" + str(date_obj.hour)
        else :
            completingTime = str(date_obj.hour)
        if(date_obj.minute < 10): 
            competingTime = completingTime  + ":0" + str(date_obj.minute) 
        else: 
            completingTime = completingTime + ":" + str(date_obj.minute)
        # creation of the remaining elements for visualizing the seconds
        variationSecond = str(newDateVis) 
        if(newDateVis < 10):
            variationSecond = "0" + variationSecond
        # creation of the new label for the visualization in seconds 
        labelToShow = completingTime + ":" + variationSecond
    if(vis_granularity == "mm"):
        newDateVis = date_obj.minute
        if(date_obj.hour < 10):
            completingTime = "0" + str(date_obj.hour)
        else :
            completingTime = str(date_obj.hour)
        variationMinutes = str(newDateVis)
        if(newDateVis < 10):
            variationMinutes = "0" + variationMinutes
        labelToShow = completingTime + ":" + variationMinutes + ":00"
    if(vis_granularity == "hh"):
        newDateVis = date_obj.hour
        variationHour = str(newDateVis)
        if(newDateVis < 10):
            variationHour = "0" + variationHour
        labelToShow = variationHour + ":00:00"
    # object to return 
    currPointObj = {
                    "id" : None,
                    "dateread" : date_obj,
                    "date" : labelToShow,
                    "value" : point[1],
                    "session" : "",
                    "sessionId" : sessionId,
                    "gasId" : gasId
                    }
    return currPointObj
