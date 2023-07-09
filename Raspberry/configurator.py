#
# Module for reading the configurations from the config file 
# this module contains also the definition of the configurations object passed to 
# parallel tasks concurrently
#

# standard libraries
from multiprocessing import Queue
import multiprocessing
from xml.dom import minidom
import os

# configuration object shared by the pallel tasks of the procedure 
class SensorsDataConfig:
    def __init__(self):
        # parallel queues of reading from the different sensors 
        self.queueDataSensorsMQ = Queue()                             
        self.queueSCD = Queue()

        # csv data header (common to all the tasks)
        manager = multiprocessing.Manager()     
        self.csvDataHeader = manager.list()       
        
        # files attributes 
        self.maxLineNum = 100                                      
        self.mainPath = "C:\\Users\\Fede\\Documents\\Arduino"      
        self.outputSensorFolder = "SensorsData"                    
        self.outputDownloadFolder = "DownloadFolderData"           
        self.csvBasicName = "sensorsAnalysis"                      
        
        # arduino parameters
        self.activeArduino = True                                  
        self.arduinoSerialPort = "COM3"
        self.arduinoBaudRate = 115200
        self.arduinoDutyCycle = 0.1

        # scd sensor parameters 
        self.scdPort = '/dev/i2c-1'
        self.activeSCD = False                                     
        self.scdMeasureTime = 5

    def sensorDataQueue(self):
        return self.queueDataSensorsMQ
    def sensorSCDQueue(self):
        return self.queueSCD

    def setHeader(self, header):
        for headerCol in header:
            self.csvDataHeader.append(headerCol)
    def getHeader(self):
        return self.csvDataHeader

    def getMaxLineNum(self):
        return self.maxLineNum
    def setMaxLineNum(self, maxLine):
        self.maxLineNum = maxLine

    def setMainDataPath(self, mainPath):
        self.mainPath = mainPath
    def setSensorsDataFolder(self, sensorsDataFolder):
        self.outputSensorFolder = sensorsDataFolder
    def setSensorsDownloadFolder(self, seonsorsDownloadFolder):
        self.outputDownloadFolder = seonsorsDownloadFolder
    def setFileCSVBasicName(self, csvBasicName):
        self.csvBasicName = csvBasicName

    def setArduinoActivated(self, activationValue):
        self.activeArduino = activationValue
    def setArduinoSerialPort(self, arduinoSerialPort):
        self.arduinoSerialPort = arduinoSerialPort
    def getArduinoSerialPort(self):
        return self.arduinoSerialPort
    def setArduinoBaudRate(self, arduinoBaudRate):
        self.arduinoBaudRate = arduinoBaudRate
    def getArduinoBaudRate(self):
        return self.arduinoBaudRate
    def setArduinoDutyCycle(self, arduinoDutyCycle):
        self.arduinoDutyCycle = arduinoDutyCycle
    def getArduinoTime(self):
        return self.arduinoDutyCycle

    def setSCDActivated(self, activationValue):
        self.activeSCD = activationValue
    def setSCDPort(self, scdPort):
        self.scdPort = scdPort
    def getI2CPortSCD(self):
        return self.scdPort
    def setSCDDutyTime(self, scdDutyTime):
        self.scdMeasureTime = scdDutyTime

    def getSensorsDataPath(self):
        pathSensors = os.path.join(self.mainPath, self.outputSensorFolder)
        if(os.path.isdir(pathSensors)):
            return pathSensors
        os.mkdir(pathSensors)
        return pathSensors
    def getDownloadDataPath(self):
        pathDownload = os.path.join(self.mainPath, self.outputDownloadFolder)
        if(os.path.isdir(pathDownload)):
            return pathDownload
        os.mkdir(pathDownload)
        return pathDownload
    def getCSVBasicName(self):
        return self.csvBasicName
    
# simple method for conversion from string to bool
def booleConverter(stringValue):
    if(stringValue == "True"): return True
    return False
    
# read configuration method 
def readConfiguration(configFile):
    SensorsDataObj = SensorsDataConfig()
    xmlConfig = minidom.parse(configFile)
    configurations = xmlConfig.getElementsByTagName('config')
    for configuration in configurations:
        if(configuration.attributes['name'].value == "csv_max_line"):
            SensorsDataObj.setMaxLineNum(int(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "main_procedure_path"):
            SensorsDataObj.setMainDataPath(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "sensors_folder_out"):
            SensorsDataObj.setSensorsDataFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "download_folder_out"):
            SensorsDataObj.setSensorsDownloadFolder(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "csv_basic_name"):
            SensorsDataObj.setFileCSVBasicName(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "arduino_activated"):
            SensorsDataObj.setArduinoActivated(booleConverter(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "arduino_serial_port"):
            SensorsDataObj.setArduinoSerialPort(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "arduino_baud_rate"):
            SensorsDataObj.setArduinoBaudRate(int(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "arduino_duty_time"):
            SensorsDataObj.setArduinoDutyCycle(float(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "scd_activated"):
            SensorsDataObj.setSCDActivated(booleConverter(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "scd_i2c_port"):
            SensorsDataObj.setSCDPort(str(configuration.firstChild.data))
        if(configuration.attributes['name'].value == "scd_duty_time"):
            SensorsDataObj.setSCDDutyTime(int(configuration.firstChild.data))

    return SensorsDataObj

