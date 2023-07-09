#
# a simple module for the simulations of the different sensors in case of unavailability 
#

# standard modules
import random
import time 
from datetime import datetime, timedelta
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
