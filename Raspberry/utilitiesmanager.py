#
# utilities functions for sensors string management and detection 
#

# standard modules 
from datetime import timedelta

# utilities functions for overall procedure 
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
