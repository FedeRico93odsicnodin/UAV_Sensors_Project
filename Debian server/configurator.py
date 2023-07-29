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
    return ServerDataObj