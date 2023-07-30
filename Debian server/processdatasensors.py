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
import databaseServer
import dbmodels


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

def dataSensorsElaborateThread(serverDataObj):
    currDir = os.getcwd()
    outputCSVFolder = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    dbLocation = getDBLocation(serverDataObj)
    waitingProcessTime = serverDataObj.getWaitingProcessTime()
    global initGasesData
    global initSensorsData
    global currSession
    while(True):
        currSession = {}
        orderedFilesToProcess = []
        pendingCSVFiles = os.listdir(outputCSVFolder)
        if(len(pendingCSVFiles) == 0):
            time.sleep(waitingProcessTime)
        for fileCSV in pendingCSVFiles:
            currFileDate = getFileDate(fileCSV)
            orderedFilesToProcess = addFileRefToDictionary(fileCSV, currFileDate, orderedFilesToProcess)
        while(len(orderedFilesToProcess) > 0):
            fileName = orderedFilesToProcess[0]["fileName"]
            filePath = os.path.join(outputCSVFolder, fileName)
            with open(filePath, 'r') as f:
                csvdata = csv.reader(f)
                # getting the first header definition on the first csv row 
                csvheader = initGasesAndSensors(csvdata)
                # getting the SCD columns params for calibration
                scdParams = initSCDParametersCalibration(csvheader)
                # getting the session header column index 
                sessionCol = initSessionColIndex(csvheader)
                # checking if need to add initial or extra gases to current analysis 
                initGasesData = checkIfNewGasesToAdd(csvheader, initGasesData, dbLocation)
                # checking if need to add initial or extra sensors to current analysis 
                initSensorsData = checkIfNewSensorsToAdd(csvheader, initSensorsData, initGasesData, dbLocation)
                # prepare and store current data values
                beginProcessSensorsData(csvdata, csvheader, dbLocation)

def dataSnesorsElaborateThreadTEST(refCSVPath, dbLocation):
    global initGasesData
    global initSensorsData
    global currSession
    currSession = None
    with open(refCSVPath, 'r') as f:
        csvdata = csv.reader(f)
        # getting the first header definition on the first csv row 
        print('\n')
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
        print(sessionCol)
        # checking if need to add initial or extra gases to current analysis 
        print('\n')
        initGasesData = checkIfNewGasesToAdd(csvheader, initGasesData, dbLocation)
        print('STEP4: current gases')
        print(initGasesData)
        # checking if need to add initial or extra sensors to current analysis 
        print('\n')
        initSensorsData = checkIfNewSensorsToAdd(csvheader, initSensorsData, initGasesData, dbLocation)
        print('STEP5: current sensors')
        print(initSensorsData)
        # prepare and store current data values
        beginProcessSensorsData(csvdata, csvheader, dbLocation)

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
                    "sensor" : colHeaderParts[1],
                    "sensorDescr" : "nd"
                }
                retrievedStartInfo.append(tsValue)
                continue
            # identification of compound and relative sensor
            colHeaderParts = colHeader.split('|')
            if(len(colHeaderParts) != 3):
                otherVal = {
                    "gas": "other",
                    "sensor" : colHeader,
                    "sensorDescr" : "nd"
                }
                retrievedStartInfo.append(otherVal)
                continue
            
            currColValues = {
                "gas": colHeaderParts[0]
                , "sensor": colHeaderParts[1]
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
    return idx

def getDBLocation(serverDataObj):
    currDir = os.getcwd()
    outputDBPath = os.path.join(currDir, serverDataObj.getProcessedDBFolder(), serverDataObj.getDatabaseName())
    return outputDBPath

def checkIfNewGasesToAdd(rowHeader, prevStoredGases, dbLocation):
    # data still not initiliazed with previous info
    if(len(prevStoredGases) == 0):
        prevStoredGases = databaseServer.getCompoundsDefinitions(dbLocation)
    allNewCompoundsInCSV = []
    for sensorHeaderCol in rowHeader:
        if sensorHeaderCol['gas'] in prevStoredGases.keys():
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        allNewCompoundsInCSV.append((None, sensorHeaderCol['gas']))
    if(len(allNewCompoundsInCSV) > 0):
        databaseServer.insertCompoundsData(dbLocation, allNewCompoundsInCSV)
        prevStoredGases = databaseServer.getCompoundsDefinitions(dbLocation)
    return prevStoredGases

def checkIfNewSensorsToAdd(rowHeader, prevStoredSensors, checkedStoredGases, dbLocation):
    if(len(prevStoredSensors) == 0):
        prevStoredSensors = databaseServer.getSensorsDefinitions(dbLocation)
    allNewSensorsInCSV = []
    for sensorHeaderCol in rowHeader:
        if(sensorHeaderCol['sensor'] in prevStoredSensors.keys()):
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        # getting the information to persist for current row
        sensorName = sensorHeaderCol['sensor']
        sensorDescription = sensorHeaderCol['sensorDescr']
        refGasID = checkedStoredGases[sensorHeaderCol['gas']].id
        allNewSensorsInCSV.append((None, sensorName, sensorDescription, refGasID))
    if(len(allNewSensorsInCSV) > 0):
        databaseServer.insertSensorsData(dbLocation, allNewSensorsInCSV)
        prevStoredSensors = databaseServer.getCompoundsDefinitions(dbLocation)
    return prevStoredSensors
 
def beginProcessSensorsData(csvdata, csvHeader, dbLocation):
    idx = 0
    for sensorData in csvdata:
        # data of the already analyzed header
        if(idx == 0): 
            idx = idx + 1
            continue
        # initializing the session
        if(idx == 1): 
            currSession = checkSessionDB(sensorData, dbLocation)
        # processing sensor data row
        processSensorsDataRow(sensorData, csvHeader, currSession, dbLocation)

def checkSessionDB(sensorData, dbLocation):
    global currSession
    if(currSession != None):
        return currSession
    dateStampFormat = '%Y-%m-%d %H:%M:%S.%f'
    currSessionDatestamp = sensorData[sessionCol]
    currSessionDate = datetime.strptime(currSessionDatestamp, dateStampFormat)
    currSessionName = 'session started in ' + currSessionDatestamp
    currSessionObj = databaseServer.getSensorCurrSession(dbLocation, currSessionName)
    if(currSessionObj == None):
        databaseServer.addNewSessionValue(dbLocation, currSessionName, currSessionDate)
        currSessionObj = databaseServer.getSensorCurrSession(dbLocation, currSessionName)
    else: print('session present')
    currSession = currSessionObj
    return currSession

def processSensorsDataRow(sensorDataRow, csvHeader, currSession, dbLocation):
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
    print(initSensorsData)
    for csvContent in csvHeader:
        if(trackNotAnalyzedColumn(csvContent)):
            idxCsv = idxCsv + 1
            continue
        print(csvContent)
        # definition of other parameters not to persist as data sensors 
        if(csvContent['gas'] == 'other'):
            idxCsv = idxCsv + 1
            continue
        # definition for the timestamps of the current row 
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == '(Arduino)':
            arduinoTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
            print(arduinoTimestamp)
            idxCsv = idxCsv + 1
            continue
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == '(Rpi)':
            raspberryTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
            print(raspberryTimestamp)
            idxCsv = idxCsv + 1
            continue
        # sensed value 
        sensedValue = processSensorData(csvContent, sensorDataRow[idxCsv])
        print(sensedValue)
        sensorRefId = initSensorsData[csvContent['sensor']].id
        gasRefId = initGasesData[csvContent['gas']].id
        sessionRefId = currSession.id
        # obj creation 
        currSensorObj = dbmodels.SensorDataObj()
        if(isArduinoSensor(csvContent['sensor'])):
            currSensorObj.date = arduinoTimestamp
        else:
            currSensorObj.date = raspberryTimestamp
        currSensorObj.detected_substance_id = gasRefId
        currSensorObj.detected_substance_val = sensedValue
        currSensorObj.sensor_id = sensorRefId
        currSensorObj.session_ref = sessionRefId
        toInsertValues.append(currSensorObj)
        idxCsv = idxCsv + 1
    # insert values to db 
    print(toInsertValues)
    databaseServer.insertDataSensor(dbLocation, toInsertValues)
        

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
     if(colDefinition['gas'] == 'SCD time'):
         return True
     if(colDefinition['gas'] == 'ticksC'):
         return True
     if(colDefinition['gas'] == 'ticksRH'):
         return True
     if(colDefinition['sensor'] == 'Session'):
         return True
     return False
        
def processSensorData(sensorDefinition, sensorValue):
    sensedValue = 0
    if(sensorValue != ''):
        sensedValue = float(sensorValue)
    # calibration for the MQ sensors 
    if(sensorDefinition['sensor'] == 'MQ4'):
        sensedValue = calibrateMQ4Sensor(sensorValue)
    if(sensorDefinition['sensor'] == 'MQ7'):
        sensedValue = calibrateMQ7Sensor(sensorValue)
    if(sensorDefinition['sensor'] == 'MQ5'):
        sensedValue = calibrateMQ5Sensor(sensorValue)
    if(sensorDefinition['sensor'] == 'MQ3'):
        sensedValue = calibrateMQ3Sensor(sensorValue)
    if(sensorDefinition['sensor'] == 'MQ135'):
        sensorValue = calibrateMQ135Sensor(sensorValue)
    if(sensorDefinition['sensor'] == 'MQ2'):
        sensorValue = calibrateMQ2Sensor(sensorValue)
    return sensorValue
    

def calibrateMQ4Sensor(sensorValue):
    # TODO: implementation for the MQ4 calibration process
    return sensorValue

def calibrateMQ7Sensor(sensorValue):
    # TODO: implementation for the MQ7 calibration process
    return sensorValue

def calibrateMQ5Sensor(sensorValue):
    # TODO: implementation for the MQ5 calibration process 
    return sensorValue

def calibrateMQ3Sensor(sensorValue):
    # TODO: implementation for the MQ3 calibration process 
    return sensorValue 

def calibrateMQ135Sensor(sensorValue):
    # TODO: implementation for the MQ135 calibration process 
    return sensorValue 

def calibrateMQ2Sensor(sensorValue):
    # TODO: implementation for the MQ2 calibration process 
    return sensorValue