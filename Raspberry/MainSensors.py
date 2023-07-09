from multiprocessing import Process, Queue
import multiprocessing
import threading 
import serial
import time 
from datetime import datetime, timedelta
import os
from csv import writer
import random
from sensirion_i2c_driver import LinuxI2cTransceiver, I2cConnection
from sensirion_i2c_scd import Scd4xI2cDevice



#variables
nowTime = datetime.now()        # execution time start 
class SensorsData:
    def __init__(self):
        self.queueDataSensorsMQ = Queue()                             # the queue for the sensor data lines 
        self.queueSCD = Queue()
        manager = multiprocessing.Manager()     
        self.csvDataHeader = manager.list()                         # the header of the CSV file
        self.maxLineNum = 100                                       # the max line increment for the CSV file 
        self.mainPath = "C:\\Users\\Fede\\Documents\\Arduino"       # main directory for the script output 
        self.outputSensorFolder = "SensorsData"                     # folder for the sensors data 
        self.outputDownloadFolder = "DownloadFolderData"            # folder for the download data 
        self.csvBasicName = "sensorsAnalysis"                       # basic name part for the sensor data sheet 
        # debug Arduino - Raspberry
        self.activeArduino = True                                  # if False a simulation string is replaced to the Arduino sensors
        self.activeSCD = False                                      # if False a simulation string is replaced to the SCD sensor
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

#################### UTILITIES #########################
# split of the received Arduino line according 
# to the line separator 
def splitSensorDataLine(sensorsRawLine):
    return sensorsRawLine.split('|')

# Check if the current line start with a particular sequence of character
# if it is not it is not valid for the analysis
def checkFirstIntCol(sensorsRawLine):
    return sensorsRawLine.startswith('Ms|')

# Reading the milliseconds elapsed from the start of the Arduino sketch 
# if the value is empty it will be asserted a 0 elapsed time 
def tryParseMillis(value):
    try:
        return int(value)
    except ValueError:
        return 0

########################################################

######### CLEANING ARDUINO MQ SENSORS STRING ###########

# Replacing the value for the elapsed milliseconds from the starting 
# Arduino procedure with the definition of a timestamp dependant 
# of the current running system
def replaceWithActualDate(sensorsRawLine, startingDate):
    sensorsLineParts = splitSensorDataLine(sensorsRawLine)
    lastedMillis = tryParseMillis(sensorsLineParts[1])
    currTimeSensors = startingDate + timedelta(milliseconds=lastedMillis)
    replaceOld = 'Ms|' + sensorsLineParts[1]
    replaceNew = 'Ms|' + currTimeSensors.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    sensorsRawLine = sensorsRawLine.replace(replaceOld, replaceNew)
    return sensorsRawLine

# Eventually cleaning the received raw string before continuing with the 
# analysis and elaboration of the MQ Sensors string 
def cleanMQSensorsRawString(sensorsRawLine):
    sensorsRawLine = sensorsRawLine.replace('\n', '')
    sensorsRawLine = sensorsRawLine.replace('\t', '')
    return sensorsRawLine

########################################################

########### HEADER AND CONTENT CSV CREATION ############

# Creating the column header for the CSV file of analysis
def createMQSensorsHeaders(sensorsRawLine):
    csvHeader = []
    sensorsLineParts = splitSensorDataLine(sensorsRawLine)
    for indCol, content in enumerate(sensorsLineParts):
        if(indCol == 0):
            csvHeader.append("TS (Arduino)")    # timestamp inferred for Arduino
            csvHeader.append("TS (Rpi)")        # timestamp inferred for the script 
        if(indCol == 3):
            csvHeader.append(content)           # CH4 concentration
        if(indCol == 6):
            csvHeader.append(content)           # CO concentration
        if(indCol == 9):
            csvHeader.append(content)           # Generic concentrations
        if(indCol == 12):
            csvHeader.append(content)           # Alcohol concentration
        if(indCol == 15):
            csvHeader.append(content)           # NH3 concentration
        if(indCol == 18):
            csvHeader.append(content)           # Combustibles concentration
    # TODO: completare con tutte le informazioni di header da recuperare
    return csvHeader # header initialized

def addSCDHeaderPart(csvHeader, scdHeaderPart):
    for scdHCol in scdHeaderPart:
        csvHeader.append(scdHCol)
    return csvHeader

# Reading the content to put in a line of the CSV analysis file
def readMQSensorsLine(sensorsRawLine):
    sensorsLineParts = splitSensorDataLine(sensorsRawLine)
    sensorsContentLine = []
    for indCol, content in enumerate(sensorsLineParts):
        if(indCol == 1):
            sensorsContentLine.append(content)
            sensorsContentLine.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
        if(indCol == 4):
            sensorsContentLine.append(content)
        if(indCol == 7):
            sensorsContentLine.append(content)
        if(indCol == 10):
            sensorsContentLine.append(content)
        if(indCol == 13):
            sensorsContentLine.append(content)
        if(indCol == 16):
            sensorsContentLine.append(content)
        if(indCol == 19):
            sensorsContentLine.append(content)
    return sensorsContentLine

def appendExtraContentToSensorLine(csvContent, csvExtraContent):
    for contentLine in csvExtraContent:
        csvContent.append(contentLine)
    return csvContent
  
def getNewFileCSVName(csvBasicName):
    return datetime.now().strftime('%Y%m%d%H%M%S') + "_" + csvBasicName + ".csv"

def writeCSVLine(csvNewLine, csvFilePath):
     with open(csvFilePath, 'a', newline='') as csvFile:
        csvWriter = writer(csvFile)
        csvWriter.writerow(csvNewLine)
        csvFile.close()

def moveCSVToDownloadFolder(csvPathOrigin, csvPathDestination):
    print("moving file")
    os.rename(csvPathOrigin, csvPathDestination)
        
########################################################

###################### SIMULATIONS #####################

def getSimulatedSensorValue(range1, range2, baseNum):
    rndSensInt = random.randint(range1, range2)
    rndSensFloat = rndSensInt / baseNum
    return rndSensFloat

def getSimulatedArduinoStringSensors(startTime):
    endTime = time.time()
    elapsedTime = int(round((endTime - startTime)*1000))
    rndStringSensors = "Ms|"
    rndStringSensors += str(elapsedTime)
    rndStringSensors += "|0|CH4|"
    rndStringSensors += str(getSimulatedSensorValue(10000, 20000, 100))
    rndStringSensors += "|1|CO|"
    rndStringSensors += str(getSimulatedSensorValue(10000, 20000, 100))
    rndStringSensors += "|2|Gen|"
    rndStringSensors += str(getSimulatedSensorValue(10000, 20000, 100))
    rndStringSensors += "|3|Alcohol|"
    rndStringSensors += str(getSimulatedSensorValue(40000, 50000, 100))
    rndStringSensors += "|4|NH3|"
    rndStringSensors += str(getSimulatedSensorValue(10000, 20000, 100))
    rndStringSensors += "|5|Comb|"
    rndStringSensors += str(getSimulatedSensorValue(30000, 40000, 100))
    rndStringSensors += "|"
    return rndStringSensors

def getSimulatedSCDContent():
    rndSCDContent = []
    rndSCDContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
    rndSCDContent.append(str(getSimulatedSensorValue(10000, 20000, 100)))
    rndSCDContent.append(str(getSimulatedSensorValue(300, 359, 10)))
    rndSCDContent.append(str(time.time()))
    rndSCDContent.append(str(getSimulatedSensorValue(10000, 20000, 100)))
    rndSCDContent.append(str(time.time()))
    return rndSCDContent
    
######################################################## 

def mqDetectionProcess(sensorsObj):
    arduino = None
    if(sensorsObj.activeArduino == True):
        arduino = serial.Serial(port='COM3', baudrate=115200, timeout=.1)
    nowTime = datetime.now()
    startTime = time.time()
    csvHeader = []
    csvHeaderSCD = ["SCD time", "ppm CO2", "C", "ticksC", "RH", "ticksRH"]
    while(True):
        line = None
        if(arduino != None):
            line = arduino.readline() 
        else:
            line = getSimulatedArduinoStringSensors(startTime)
        if line:
            if(sensorsObj.activeArduino == False): # simulation of serial elapsed time 
                time.sleep(0.1)

            if(sensorsObj.activeArduino == True): # line provining from the serial port 
                sensorsRawLine = line.decode() 
            else:
                sensorsRawLine = line             # line provining from the simulation
             # STEP1: SYNC with Arduino sensors actual line 
            if(checkFirstIntCol(sensorsRawLine) == False): continue

            # STEP2: Replacing of the correct timestamp for MQ sensors reading 
            sensorsRawLine = replaceWithActualDate(sensorsRawLine, nowTime)

            # STEP3: Cleaning the raw line string before continuing 
            sensorsRawLine = cleanMQSensorsRawString(sensorsRawLine)

            # STEP4: Reading infomration for the current line 
            sensorsCurrLine = readMQSensorsLine(sensorsRawLine)

            # STEP5: building the header of CSV File 
            if(len(csvHeader) == 0):
                csvHeader = createMQSensorsHeaders(sensorsRawLine)
                csvHeader = addSCDHeaderPart(csvHeader, csvHeaderSCD) # adding the SCD Header part 
                sensorsObj.setHeader(csvHeader)
                
            # STEP8: enqueuing the line content 
            sensorsObj.sensorDataQueue().put(sensorsCurrLine)

def scdSensorDetectionThread(sensorsObj):
    scd41 = None
    sensorContent = []
    if(sensorsObj.activeSCD):
        with LinuxI2cTransceiver('/dev/i2c-1') as i2c_transceiver:
            i2c_connection = I2cConnection(i2c_transceiver)
            scd41 = Scd4xI2cDevice(i2c_connection)
            scd41.start_periodic_measurement()
            while(True):
                time.sleep(int(sensorsObj.scdMeasureTime))
                co2, temperature, humidity = scd41.read_measurement()
                sensorContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
                sensorContent.append(str(co2.co2))
                sensorContent.append(str(temperature.degrees_celsius))
                sensorContent.append(str(temperature.ticks))
                sensorContent.append(str(humidity.percent_rh))
                sensorContent.append(str(humidity.ticks))
                sensorsObj.sensorSCDQueue().put(sensorContent)
    else:
        while(True):
            sensorContent = getSimulatedSCDContent()
            sensorsObj.sensorSCDQueue().put(sensorContent)
            
def writeCSVFile(sensorsObj):
    csvHeaderInit = False
    lineIncrement = 0
    sensorsDataPath = sensorsObj.getSensorsDataPath()
    downloadDataPath = sensorsObj.getDownloadDataPath()
    csvFileName = getNewFileCSVName(sensorsObj.getCSVBasicName())
    # path for the output and for the final download 
    csvOutputPath = os.path.join(sensorsDataPath, csvFileName)
    csvDownloadPath = os.path.join(downloadDataPath, csvFileName)
    sensorMQLine = ["", "", "", "", "", ""]
    print(csvOutputPath)
    print(csvDownloadPath)
    while(True):
        if(sensorsObj.sensorDataQueue().qsize() == 0): continue
        sensorDLine = sensorsObj.sensorDataQueue().get()
        lineIncrement = lineIncrement + 1
        if(csvHeaderInit == False):
            print(sensorsObj.getHeader())
            writeCSVLine(sensorsObj.getHeader(), csvOutputPath)
            csvHeaderInit = True
        
        if(sensorsObj.sensorSCDQueue().qsize() == 0):
            sensorDLine = appendExtraContentToSensorLine(sensorDLine, sensorMQLine)
        else:
            sensorMQLine = sensorsObj.sensorSCDQueue().get()
            sensorDLine = appendExtraContentToSensorLine(sensorDLine, sensorMQLine)
        print(sensorDLine)
        writeCSVLine(sensorDLine, csvOutputPath)
        # management of the new file creation 
        if(lineIncrement == sensorsObj.getMaxLineNum()):
            csvHeaderInit = False
            lineIncrement = 0
            moveCSVToDownloadFolder(csvOutputPath, csvDownloadPath)
            csvFileName = getNewFileCSVName(sensorsObj.getCSVBasicName())
            csvOutputPath = os.path.join(sensorsDataPath, csvFileName)
            csvDownloadPath = os.path.join(downloadDataPath, csvFileName)


if __name__ == '__main__':
    SensorsDataObj = SensorsData()
    #mainSensorsProcess(SensorsDataObj)
    scdDetectionThread = threading.Thread(target=scdSensorDetectionThread, args=(SensorsDataObj,))
    sensorsDataProcess = Process(target=mqDetectionProcess, args=(SensorsDataObj,))
    writeCSVFileProcess = Process(target=writeCSVFile, args=(SensorsDataObj,))
    # Start both processes
    scdDetectionThread.start()
    sensorsDataProcess.start()
    time.sleep(2)
    writeCSVFileProcess.start()
    # Wait for both processes to finish
    scdDetectionThread.join()
    sensorsDataProcess.join()
    writeCSVFileProcess.join()
    