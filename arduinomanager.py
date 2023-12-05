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

# main body of the process reading data from arduino
def MQDetectionProcess(sensorsObj):
    arduino = None
    if(sensorsObj.activeArduino == True):
        arduino = serial.Serial(port=sensorsObj.getArduinoSerialPort(), baudrate=sensorsObj.getArduinoBaudRate(), timeout=sensorsObj.getArduinoTime())
    nowTime = datetime.now()
    startTime = time.time()
    print('SERIAAAAL: ' + str(serial.__file__))
    csvHeader = []
    while(True):
        line = None
        if(arduino != None):
            line = arduino.readline() 
        else:
            line = simulators.getSimulatedArduinoStringSensors(startTime)
        if line:
            if(sensorsObj.activeArduino == False): # simulation of serial elapsed time 
                time.sleep(0.1)

            if(sensorsObj.activeArduino == True): # line provining from the serial port 
                if(sensorsObj.currSys == "WIN"):
                    sensorsRawLine = line.decode() 
                else: sensorsRawLine = line.decode('utf-8').rstrip() # raspberry default system
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
