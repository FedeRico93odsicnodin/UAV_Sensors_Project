#
# Module for reading the configurations from the config file 
# this module contains also the definition of the configurations object passed to 
# parallel tasks concurrently
#

from xml.dom import minidom

# class of configurations and common elements 
class ServerDataConfig:
    def __init__(self):
        # CSV parameters and specifications
        self.uploadCSVFolder = "uploaded_csv"
        self.processCSVFolder = "processed_db"
        self.databaseName = "sensorsAnalysis.db"
        # waiting time in second for the processing thread 
        self.waitingProcessTime = 5
        # test cases utilities 
        self.curr_test_case = ''
        self.ref_csv_path = ''
        self.ref_docs_folder = ''
        # curr mode of the runtime application
        self.run_mode = 'CALIB'
        self.debug_ppm_calculus = False

    def setUploadCSVFolder(self, folderUpload):
        self.uploadCSVFolder = folderUpload 
    def getUploadCSVFolder(self):
        return self.uploadCSVFolder
    def setProcessedDBFolder(self, folderProcessedCSV):
        self.processCSVFolder = folderProcessedCSV
    def getProcessedDBFolder(self):
        return self.processCSVFolder
    def setDatabaseName(self, databaseName):
        self.databaseName = databaseName
    def getDatabaseName(self):
        return self.databaseName
    
    def setWaitingProcessTime(self, processTime):
        self.waitingProcessTime = processTime
    def getWaitingProcessTime(self):
        return self.waitingProcessTime
    
    def setCurrTestCase(self, testCase):
        self.curr_test_case = testCase
    def getCurrTestCase(self):
        return self.curr_test_case
    def setCurrCsvRefName(self, ref_csv):
        self.ref_csv_path = ref_csv
    def getCurrCsvRefName(self):
        return self.ref_csv_path
    def setRefDocsFolder(self, ref_docs_folder):
        self.ref_docs_folder = ref_docs_folder
    def getRefDocsFolder(self):
        return self.ref_docs_folder
    
    # curr mode for the application
    def setCurrRunMode(self, runMode):
        self.run_mode = runMode
    def getCurrRunMode(self):
        return self.run_mode
    def setDebugPPMCalculus(self, ppmCalcFlag):
        self.debug_ppm_calculus = ppmCalcFlag
    def getDebugPPMCalculus(self):
        return self.debug_ppm_calculus
        

# read configuration method
def readConfiguration(configFile):
    ServerDataObj = ServerDataConfig()
    xmlConfig = minidom.parse(configFile)
    configurations = xmlConfig.getElementsByTagName('config')
    for configuration in configurations:
        if(configuration.attributes['name'].value == "csv_upload_folder"):
            ServerDataObj.setUploadCSVFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "csv_post_folder"):
            ServerDataObj.setProcessedDBFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "database_name"):
            ServerDataObj.setDatabaseName(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "post_process_waiting_time"):
            ServerDataObj.setWaitingProcessTime(int(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "curr_execution_test"):
            ServerDataObj.setCurrTestCase(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "csv_test_ref"):
            ServerDataObj.setCurrCsvRefName(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "ref_docs_folder"):
            ServerDataObj.setRefDocsFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "run_mode"):
            ServerDataObj.setCurrRunMode(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "debug_ppm_calculus"):
            if(str(configuration.firstChild.data) == "True"):
                ServerDataObj.setDebugPPMCalculus(True)
            else: ServerDataObj.setDebugPPMCalculus(False)
    return ServerDataObj