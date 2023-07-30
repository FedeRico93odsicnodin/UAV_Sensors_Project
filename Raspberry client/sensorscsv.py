#
# manager for writing the CSV with the sensor data collection 
#

# standard modules 
import utilitiesmanager
from datetime import datetime
from csv import writer
import os
########### HEADER CREATION ############
# Creating the column header for the CSV file of analysis
def createSensorsHeader(sensorsRawLine):
    csvHeader = []
    csvHeaderSCD = ["SCD4 time|SCD41|description SCD41", "ppm CO2|SCD41|description SCD41", "C|SCD41|description SCD41", "ticksC|SCD41|description SCD41", "RH|SCD41|description SCD41", "ticksRH|SCD41|description SCD41"]
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
    return datetime.now().strftime('%Y_%m_%d_%H_%M_%S_%f')[:-3] + "_" + csvBasicName + ".csv"

def writeCSVLine(csvNewLine, csvFilePath):
     with open(csvFilePath, 'a', newline='') as csvFile:
        csvWriter = writer(csvFile)
        csvWriter.writerow(csvNewLine)
        csvFile.close()

def moveCSVToDownloadFolder(csvPathOrigin, csvPathDestination):
    print("moving file")
    os.rename(csvPathOrigin, csvPathDestination)
     