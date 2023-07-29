#
# CSV writing and transferring utilities 
#

# standard modules 
import os
import threading 
from datetime import datetime
# custom modules 
import sensorscsv
import postcontenttoserver

# main body for the writer manager of CSV obtained from the read sensors data 
def CSVFileWriterProcess(sensorsObj):
    csvHeaderInit = False
    lineIncrement = 0
    sensorsDataPath = sensorsObj.getSensorsDataPath()
    downloadDataPath = sensorsObj.getDownloadDataPath()
    csvFileName = sensorscsv.getNewFileCSVName(sensorsObj.getCSVBasicName())
    # path for the output and for the final download 
    csvOutputPath = os.path.join(sensorsDataPath, csvFileName)
    csvDownloadPath = os.path.join(downloadDataPath, csvFileName)
    sessionDateTime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    sensorMQLine = ["", "", "", "", "", ""]
    print(csvOutputPath)
    print(csvDownloadPath)
    # upload to server thread 
    uploadingToServerThread = threading.Thread(target=postcontenttoserver.CSVPostToServer, args=(sensorsObj,))
    uploadingToServerThread.start()
    while(True):
        if(sensorsObj.sensorDataQueue().qsize() == 0): continue
        sensorDLine = sensorsObj.sensorDataQueue().get()
        lineIncrement = lineIncrement + 1
        if(csvHeaderInit == False):
            print(sensorsObj.getHeader())
            sensorscsv.writeCSVLine(sensorsObj.getHeader(), csvOutputPath)
            csvHeaderInit = True
        
        if(sensorsObj.sensorSCDQueue().qsize() == 0):
            sensorDLine = sensorscsv.appendExtraContentToSensorLine(sensorDLine, sensorMQLine)
        else:
            sensorMQLine = sensorsObj.sensorSCDQueue().get()
            sensorDLine = sensorscsv.appendExtraContentToSensorLine(sensorDLine, sensorMQLine)
        sensorDLine.append(sessionDateTime)
        sensorscsv.writeCSVLine(sensorDLine, csvOutputPath)
        print(sensorDLine)
        # management of the new file creation 
        if(lineIncrement == sensorsObj.getMaxLineNum()):
            csvHeaderInit = False
            lineIncrement = 0
            sensorscsv.moveCSVToDownloadFolder(csvOutputPath, csvDownloadPath)
            csvFileName = sensorscsv.getNewFileCSVName(sensorsObj.getCSVBasicName())
            csvOutputPath = os.path.join(sensorsDataPath, csvFileName)
            csvDownloadPath = os.path.join(downloadDataPath, csvFileName)

