#
# manager for writing the CSV with the sensor data collection 
#

# standard modules 
import utilitiesmanager
from datetime import datetime
from csv import writer
import os
########### HEADER CREATION ############

# the set of the last useful information for the Arduino board and the various MQs
# (still string form)
arduinoUsefulLastReadInfo = ['0', '0', '0', '0', '0', '0', '0', '0']

# Creating the column header for the CSV file of analysis
def createSensorsHeader(sensorsRawLine):
    csvHeader = []
    csvHeaderSCD = ["SCD time|SCD41|description SCD41", "ppm CO2|SCD41|description SCD41", "C|SCD41|description SCD41", "ticksC|SCD41|description SCD41", "RH|SCD41|description SCD41", "ticksRH|SCD41|description SCD41"]
    sensorsLineParts = utilitiesmanager.splitSensorDataLine(sensorsRawLine)
    # line of arduino is the first in header overall initialization 
    for indCol, content in enumerate(sensorsLineParts):
        if(indCol == 0):
            csvHeader.append("TS|(Arduino)")    # timestamp inferred for Arduino
            csvHeader.append("TS|(Rpi)")        # timestamp inferred for the script 
        if(indCol == 3):
            content = content.replace('_', '|')
            csvHeader.append(content)           # CH4 concentration
        if(indCol == 6):
            content = content.replace('_', '|')
            csvHeader.append(content)           # CO concentration
        if(indCol == 9):
            content = content.replace('_', '|')
            csvHeader.append(content)           # Generic concentrations
        if(indCol == 12):
            content = content.replace('_', '|')
            csvHeader.append(content)           # Alcohol concentration
        if(indCol == 15):
            content = content.replace('_', '|')
            csvHeader.append(content)           # NH3 concentration
        if(indCol == 18):
            content = content.replace('_', '|')
            csvHeader.append(content)           # Combustibles concentration
    addSCDHeaderPart(csvHeader, csvHeaderSCD)
    addSessionHeaderPart(csvHeader)
    return csvHeader # header initialized

def addSCDHeaderPart(csvHeader, scdHeaderPart):
    for scdHCol in scdHeaderPart:
        csvHeader.append(scdHCol)
    return csvHeader

def addSessionHeaderPart(csvHeader):
    csvHeader.append("Session")

########### CONTENT CREATION ############
# Reading the content to put in a line of the CSV analysis file
def processMQSensorsLineContent(sensorsRawLine):
    if(sensorsRawLine == ''):
        return ["", datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3], "","","","","","",]
    if(sensorsRawLine == None):
        return ["", datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3], "","","","","","",]
    sensorsLineParts = utilitiesmanager.splitSensorDataLine(sensorsRawLine)
    sensorsContentLine = []
    for indCol, content in enumerate(sensorsLineParts):
        if(indCol == 1):
            sensorsContentLine.append(str(content))
            sensorsContentLine.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
        # 2 pos in the array of final values
        if(indCol == 4):
            sensorsContentLine.append(str(content)) 
        # 3 pos in the array of final values 
        if(indCol == 7):
            sensorsContentLine.append(str(content))
        # 4 pos in the array of final values
        if(indCol == 10):
            sensorsContentLine.append(str(content))
        # 5 pos in the array of final values 
        if(indCol == 13):
            sensorsContentLine.append(str(content))
        # 6 pos in the array of final values 
        if(indCol == 16):
            sensorsContentLine.append(str(content))
        # 7 pos in the array of final values 
        if(indCol == 19):
            sensorsContentLine.append(str(content))
    return sensorsContentLine

# checking the congruency of the Arduino conveted information and eventual substitution 
# with the last useful value found for the sensor 
# if no value was registered before, then the 0 value will be replaced 
def checkArduinoValuesCoherence(sensorsArrayLine):
    # array of the last useful collected information 
    global arduinoUsefulLastReadInfo
    # checking the value for the CH4
    try:
        float(sensorsArrayLine[2])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[2] = sensorsArrayLine[2]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[2] = arduinoUsefulLastReadInfo[2]
    
    # checking the value for the CO
    try:
        float(sensorsArrayLine[3])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[3] = sensorsArrayLine[3]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[3] = arduinoUsefulLastReadInfo[3]
    
    # checking the value for the Gen
    try:
        float(sensorsArrayLine[4])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[4] = sensorsArrayLine[4]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[4] = arduinoUsefulLastReadInfo[4]

    # checking the value for the Alcohol
    try:
        float(sensorsArrayLine[5])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[5] = sensorsArrayLine[5]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[5] = arduinoUsefulLastReadInfo[5]

    # checking the value for the NH3
    try:
        float(sensorsArrayLine[6])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[6] = sensorsArrayLine[6]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[6] = arduinoUsefulLastReadInfo[6]

    # checking the value for the Comb
    try:
        float(sensorsArrayLine[7])
        # replacing the last useful value 
        arduinoUsefulLastReadInfo[7] = sensorsArrayLine[7]
    except:
        # substuting with the value of the last meaningful read 
        sensorsArrayLine[7] = arduinoUsefulLastReadInfo[7]
    return sensorsArrayLine


def appendExtraContentToSensorLine(csvContent, csvExtraContent):
    for contentLine in csvExtraContent:
        csvContent.append(contentLine)
    return csvContent
  
def getNewFileCSVName(csvBasicName):
    return datetime.now().strftime('%Y_%m_%d_%H_%M_%S_%f')[:-3] + "_" + csvBasicName + ".csv"

def writeCSVLine(csvNewLine, csvFilePath):
     with open(csvFilePath, 'a', newline='') as csvFile:
        csvWriter = writer(csvFile)
        csvWriter.writerow(csvNewLine)
        csvFile.close()

def moveCSVToDownloadFolder(csvPathOrigin, csvPathDestination):
    #print("moving file")
    os.rename(csvPathOrigin, csvPathDestination)
     