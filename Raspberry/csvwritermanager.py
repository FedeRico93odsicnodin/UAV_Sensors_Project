#
# CSV writing and transferring utilities 
#

# standard modules 
import os
# custom modules 
import sensorscsv

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
    sensorMQLine = ["", "", "", "", "", ""]
    print(csvOutputPath)
    print(csvDownloadPath)
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
        print(sensorDLine)
        sensorscsv.writeCSVLine(sensorDLine, csvOutputPath)
        # management of the new file creation 
        if(lineIncrement == sensorsObj.getMaxLineNum()):
            csvHeaderInit = False
            lineIncrement = 0
            sensorscsv.moveCSVToDownloadFolder(csvOutputPath, csvDownloadPath)
            csvFileName = sensorscsv.getNewFileCSVName(sensorsObj.getCSVBasicName())
            csvOutputPath = os.path.join(sensorsDataPath, csvFileName)
            csvDownloadPath = os.path.join(downloadDataPath, csvFileName)

