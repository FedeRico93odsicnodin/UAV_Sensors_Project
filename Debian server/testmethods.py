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
    print('curr test case: ' + curr_test_case)
    if(curr_test_case == 'insert_header_data'):
        insertHeaderData_test(serverDataObj)

def insertHeaderData_test(serverDataObj):
    compounds = ["test1", "test2", "test3"]
    compObj = []
    # TODO: implementation of the insert of starting data 


serverDataObj = initServer()
executeCurrTestCase(serverDataObj)
