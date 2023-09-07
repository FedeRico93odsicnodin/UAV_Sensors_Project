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
    rndStringSensors += "|0|CH4_MQ4_Description for MQ4|"
    rndStringSensors += str(getSimulatedSensorValue(73000, 75000, 100))
    rndStringSensors += "|1|CO_MQ7_Description for MQ7|"
    rndStringSensors += str(getSimulatedSensorValue(50000, 55000, 100))
    rndStringSensors += "|2|Gen_MQ5_Description for MQ5|"
    rndStringSensors += str(getSimulatedSensorValue(80000, 84000, 100))
    rndStringSensors += "|3|Alcohol_MQ3_Description for MQ3|"
    rndStringSensors += str(getSimulatedSensorValue(40000, 50000, 100))
    rndStringSensors += "|4|NH3_MQ135_Description for MQ135|"
    rndStringSensors += str(getSimulatedSensorValue(10000, 20000, 100))
    rndStringSensors += "|5|Comb_MQ2_Description for MQ2|"
    rndStringSensors += str(getSimulatedSensorValue(70000, 81000, 100))
    rndStringSensors += "|"
    return rndStringSensors

def getSimulatedSCDContent():
    rndSCDContent = []
    rndSCDContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
    rndSCDContent.append(str(getSimulatedSensorValue(10000, 20000, 100)))
    rndSCDContent.append(str(getSimulatedSensorValue(280, 290, 10)))
    rndSCDContent.append(str(time.time()))
    rndSCDContent.append(str(getSimulatedSensorValue(745, 755, 10)))
    rndSCDContent.append(str(time.time()))
    return rndSCDContent
    
######################################################## 
