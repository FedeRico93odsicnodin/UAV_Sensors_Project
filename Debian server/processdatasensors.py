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

def dataSensorsElaborateThread(serverDataObj):
    currDir = os.getcwd()
    outputCSVFolder = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    dbLocation = getDBLocation(serverDataObj)
    waitingProcessTime = serverDataObj.getWaitingProcessTime()

    # runtime analysis parameters
    csvheader = []
    initGasesData = {} 
    initSensorsData = {}

    while(True):
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
                # checking if need to add initial or extra gases to current analysis 
                initGasesData = checkIfNewGasesToAdd(csvheader, initGasesData, dbLocation)
                # checking if need to add initial or extra sensors to current analysis 
                initSensorsData = checkIfNewSensorsToAdd(csvheader, initSensorsData, initGasesData, dbLocation)
                # prepare and store current data values


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

def getSensorDate(rawSensorDate):


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
                continue
            # identification of compound and relative sensor
            colHeaderParts = colHeader.split('|')
            if(len(colHeaderParts) != 3):
                otherVal = {
                    "gas": "other",
                    "sensor" : "nd",
                    "sensorDescr" : "nd"
                }
                continue
            
            currColValues = {
                "gas": colHeaderParts[0]
                , "sensor": colHeaderParts[1]
                , "sensorDescr": colHeaderParts[2]}
            retrievedStartInfo.append(currColValues)
        break
    return retrievedStartInfo

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
 
def beginProcessSensorsData(csvdata, csvHeader, gasesDB, sensorsDB):
    for idx, sensorData in csvdata:
        # data of the already analyzed header
        if(idx == 0): continue
        processSensorsDataRow(sensorData, csvHeader)

def processSensorsDataRow(sensorDataRow, csvHeader, gasesDB, sensorsDB):
    # date formats 
    dateStampFormat = '%Y-%m-%d %H:%M:%S.%f'
    # analysis start from the retrieved CSV header 
    arduinoTimestamp = datetime.datetime(1, 1, 1, 0, 0)
    raspberryTimestamp = datetime.datetime(1, 1, 1, 0, 0)
    for idxCsv, csvContent in csvHeader:
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == 'Arduino':
            arduinoTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
        if csvContent['gas'] == 'TS' and csvContent['sensor'] == 'Raspberry':
            raspberryTimestamp = datetime.strptime(sensorDataRow[idxCsv], dateStampFormat)
        
def processSensorData(sensorDataRow, sensorType, ):
    # TODO: implementation of data 
    print('implement here the sensing procedure')