#
# MAIN for the procedure detection 
#

# standard modules
from multiprocessing import Process
import threading 
import time 
# custom modules 
import configurator
import arduinomanager
import scddetectionmanager
import csvwritermanager

if __name__ == '__main__':
    SensorsDataObj = configurator.readConfiguration("analysisConf.xml")
    #mainSensorsProcess(SensorsDataObj)
    scdDetectionThread = threading.Thread(target=scddetectionmanager.scdSensorDetectionThread, args=(SensorsDataObj,))
    sensorsDataProcess = Process(target=arduinomanager.MQDetectionProcess, args=(SensorsDataObj,))
    # csv writer manager process
    writeCSVFileProcess = Process(target=csvwritermanager.CSVFileWriterProcess, args=(SensorsDataObj,))
    # Start both processes
    scdDetectionThread.start()
    sensorsDataProcess.start()
    time.sleep(2)
    writeCSVFileProcess.start()
    # Wait for both processes to finish
    scdDetectionThread.join()
    sensorsDataProcess.join()
    writeCSVFileProcess.join()
    