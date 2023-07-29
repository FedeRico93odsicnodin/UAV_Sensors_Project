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
        self.processCSVFolder = "processed_csv"
        self.maxProcessedCSVSize = 5000000000

    def setUploadCSVFolder(self, folderUpload):
        self.uploadCSVFolder = folderUpload 
    def getUploadCSVFolder(self):
        return self.uploadCSVFolder
    def setProcessedCSVFolder(self, folderProcessedCSV):
        self.processCSVFolder = folderProcessedCSV
    def getProcessedCSVFolder(self):
        return self.processCSVFolder
    def setMaxProcessedCSVFile(self, maxSizeCSV):
        self.maxProcessedCSVSize = maxSizeCSV
    def getMaxProcessedCSVFile(self):
        return self.maxProcessedCSVSize

# read configuration method
def readConfiguration(configFile):
    ServerDataObj = ServerDataConfig()
    xmlConfig = minidom.parse(configFile)
    configurations = xmlConfig.getElementsByTagName('config')
    for configuration in configurations:
        if(configuration.attributes['name'].value == "csv_upload_folder"):
            ServerDataObj.setUploadCSVFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "csv_post_folder"):
            ServerDataObj.setProcessedCSVFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "processed_csv_max_size"):
            ServerDataObj.setMaxProcessedCSVFile(int(configuration.firstChild.data))
    
    return ServerDataObj