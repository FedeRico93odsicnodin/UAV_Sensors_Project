#
# main process for the arduino data detection 
# this procedure is the beginning procedure for the CSV and CSV header generation 
# if no arduino is detected a simulation is possible from configuration
#

# standard modules 
import utilitiesmanager
import serial
from datetime import datetime
import time 
#custom modules 
import simulators
import sensorscsv

# declaration of a default line to put in case of faults
# they may verify at the beginning of the procedure 
arduinoDefaultLine = "Ms|0|0|CH4_MQ4_Description for MQ4|0|1|CO_MQ7_Description for MQ7|0|2|Gen_MQ5_Description for MQ5|0|3|Alcohol_MQ3_Description for MQ3|0|4|NH3_MQ135_Description for MQ135|0|5|Comb_MQ2_Description for MQ2|0|\n"
lastUsefulLine = None

# main body of the process reading data from arduino
def MQDetectionProcess(sensorsObj):
    global arduinoDefaultLine
    global lastUsefulLine
    arduino = None
    if(sensorsObj.activeArduino == True):
        arduino = serial.Serial(port=sensorsObj.getArduinoSerialPort(), baudrate=sensorsObj.getArduinoBaudRate(), timeout=sensorsObj.getArduinoTime())
    nowTime = datetime.now()
    startTime = time.time()
    csvHeader = []
    # monitoring the last verified exception 
    lastException = False
    lastTimeSleep = simulators.getSimulatedSensorValue(10, 15, 1000)
    numFaultsSerial = 0
    while(True):
        # trying to get the Arduino line from its serial 
        try:
            line = None
            # remapping arduino serial
            if(lastException == True and numFaultsSerial >= 100 and sensorsObj.activeArduino == True):
                arduino = serial.Serial(port=sensorsObj.getArduinoSerialPort(), baudrate=sensorsObj.getArduinoBaudRate(), timeout=sensorsObj.getArduinoTime())
                numFaultsSerial = 0
            #if(lastException == True and sensorsObj.activeArduino == True):
            #    arduino = serial.Serial(port=sensorsObj.getArduinoSerialPort(), baudrate=sensorsObj.getArduinoBaudRate(), timeout=sensorsObj.getArduinoTime())
            if(arduino != None):
                line = arduino.readline() 
            else:
                line = simulators.getSimulatedArduinoStringSensors(startTime)
            if line:
                try:
                    if(sensorsObj.activeArduino == True): # line provining from the serial port 
                        if(sensorsObj.currSys == "WIN"):
                            sensorsRawLine = line.decode() 
                        else: sensorsRawLine = line.decode() # raspberry default system
                    else:
                        sensorsRawLine = line             # line provining from the simulation
                    # STEP1: SYNC with Arduino sensors actual line 
                    if(utilitiesmanager.checkFirstIntCol(sensorsRawLine) == False): continue

                    # STEP2: Replacing of the correct timestamp for MQ sensors reading 
                    sensorsRawLine = utilitiesmanager.replaceWithActualDate(sensorsRawLine, nowTime)

                    # STEP3: Cleaning the raw line string before continuing 
                    sensorsRawLine = utilitiesmanager.cleanMQSensorsRawString(sensorsRawLine)

                    # STEP4: Reading infomration for the current line 
                    sensorsCurrLine = sensorscsv.processMQSensorsLineContent(sensorsRawLine)

                    # STEP5: building the header of CSV File 
                    if(len(csvHeader) == 0):
                        csvHeader = sensorscsv.createSensorsHeader(sensorsRawLine)
                        sensorsObj.setHeader(csvHeader)
                    
                    # STEP8: enqueuing the line content 
                    sensorsObj.sensorDataQueue().put(sensorsCurrLine)
                    lastUsefulLine = line
                    #print("correct")
                    #print(sensorsCurrLine)
                except:
                    #print("fault 1")
                    if(lastUsefulLine == None):
                        continue
                    sensorsRawLine = lastUsefulLine  
                    
                     # STEP1: SYNC with Arduino sensors actual line 
                    if(utilitiesmanager.checkFirstIntCol(sensorsRawLine) == False): continue

                    # STEP2: Replacing of the correct timestamp for MQ sensors reading 
                    sensorsRawLine = utilitiesmanager.replaceWithActualDate(sensorsRawLine, nowTime)

                    # STEP3: Cleaning the raw line string before continuing 
                    sensorsRawLine = utilitiesmanager.cleanMQSensorsRawString(sensorsRawLine)

                    # STEP4: Reading infomration for the current line 
                    sensorsCurrLine = sensorscsv.processMQSensorsLineContent(sensorsRawLine)
                    
                    sensorsObj.sensorDataQueue().put(sensorsCurrLine)
                lastException = False
        # adding a default line for the Arduino read and waiting until the signal shows up
        except:
            #print("fault 2 n° " + str(numFaultsSerial))
            lastException = True
            timeException = simulators.getSimulatedSensorValue(10, 15, 100)
            time.sleep(timeException)
            numFaultsSerial = numFaultsSerial + 1