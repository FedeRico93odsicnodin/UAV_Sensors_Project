#
# Module for testing database calls and procedures in general
# methods can be replaced inside the app.py or be invoked externally 
# from the definition of flask server 
#

# standard modules 
import configurator
import app
import os
# custom modules 
import databaseServer
import processdatasensors
import csv

def initServer():
    # getting the current configuration from the xml file 
    serverDataObj = configurator.readConfiguration("serverConf.xml")
    # creation of the data folders for the file csv out and the database storage
    currDir = os.getcwd()
    outputCSVLocation = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    databaseLocation = os.path.join(currDir, serverDataObj.getProcessedDBFolder())
    if(os.path.exists(databaseLocation) == False):
        os.mkdir(databaseLocation)
    if(os.path.exists(outputCSVLocation) == False):
        os.mkdir(outputCSVLocation)
    databasePath = os.path.join(databaseLocation, serverDataObj.getDatabaseName())
    # database creation (if does not exist)
    databaseServer.createDatabase(databasePath)
    return serverDataObj

def executeCurrTestCase(serverDataObj):
    curr_test_case = serverDataObj.getCurrTestCase()
    print('TEST CASE: ' + curr_test_case)
    if(curr_test_case == 'insert_header_data'):
        insertHeaderData_test(serverDataObj)
    if(curr_test_case == 'insert_all_csv_info'):
        insertAllCSVInfo_test(serverDataObj)

def getRefCSVLocation(serverDataObj):
    currDir = os.getcwd()
    outputCSVPath = os.path.join(currDir, serverDataObj.getRefDocsFolder(), serverDataObj.getCurrCsvRefName())
    print("CSV LOCATION: " + outputCSVPath)
    return outputCSVPath

def getDBLocation(serverDataObj):
    currDir = os.getcwd()
    outputDBPath = os.path.join(currDir, serverDataObj.getProcessedDBFolder(), serverDataObj.getDatabaseName())
    return outputDBPath

def insertHeaderData_test(serverDataObj):
    refCSVLocation = getRefCSVLocation(serverDataObj)
    dbLocation = getDBLocation(serverDataObj)
    # retrieved elemenets from CSV
    initSensorsElements = []
    print('\nSTEP1: RETRIEVING HEADER DATA FROM CSV:')
    with open(refCSVLocation, 'r') as f:
         csvreader = csv.reader(f)
         initSensorsElements = processdatasensors.initGasesAndSensors(csvreader)
         print(initSensorsElements)

    print('\n')
    print('\nSTEP2: RETRIEVING EXISTING DATA FROM DB:')
    storedCompounds = databaseServer.getCompoundsDefinitions(dbLocation)
    storedSensorsInfo = databaseServer.getSensorsDefinitions(dbLocation)
    print(storedCompounds)
    print('\n')

    print('\nSTEP3: PERSISTING INFORMATION COMPARING WITH THE EXISTING DATA (COMPOUNDS)')
    allNewCompoundsInCSV = []
    for sensorHeaderCol in initSensorsElements:
        if sensorHeaderCol['gas'] in storedCompounds.keys():
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        allNewCompoundsInCSV.append((None, sensorHeaderCol['gas']))

    if(len(allNewCompoundsInCSV) > 0):
        databaseServer.insertCompoundsData(dbLocation, allNewCompoundsInCSV)
    else:
        print('no necessity for data addition to DB (COMPOUNDS)')
    print('\n')

    print('\nSTEP4: GETTING THE JUST STORED INFORMATION (COMPOUNDS)')
    if(len(allNewCompoundsInCSV)):
        storedCompounds = databaseServer.getCompoundsDefinitions(dbLocation)
        print(storedCompounds)
    print('\n')

    print('\nSTEP5: PERSISTING INFORMATION COMPARING WITH EXISTING DATA (SENSORS)')
    sensorsToPersist = []
    for sensorHeaderCol in initSensorsElements:
        if(sensorHeaderCol['sensor'] in storedSensorsInfo.keys()):
            continue
        if sensorHeaderCol['gas'] == 'timestamp' or sensorHeaderCol['gas'] == 'other':
            continue
        # getting the information to persist for current row
        sensorName = sensorHeaderCol['sensor']
        sensorDescription = sensorHeaderCol['sensorDescr']
        refGasID = storedCompounds[sensorHeaderCol['gas']].id
        sensorsToPersist.append((None, sensorName, sensorDescription, refGasID))
    
    if(len(sensorsToPersist) > 0):
        databaseServer.insertSensorsData(dbLocation, sensorsToPersist)
    else:
        print('no necessity for data addition to DB (SENSORS)')
    print('\n')

def insertAllCSVInfo_test(serverDataObj):
    currDir = os.getcwd()
    databaseLocation = getDBLocation(serverDataObj)
    refCSV = getRefCSVLocation(serverDataObj)
    processdatasensors.dataSnesorsElaborateThreadTEST(refCSV, databaseLocation)

serverDataObj = initServer()
executeCurrTestCase(serverDataObj)
