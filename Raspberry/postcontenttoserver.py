import os
import requests
import time 
from datetime import datetime 

def CSVPostToServer(sensorsObj):
    # i files di cui fare l'upload che vengono ordinati per data
    orderedFilesToUpload = []
    downloadDataPath = sensorsObj.getDownloadDataPath()
    interruption = False
    #serverAddress = sensorsObj.getServerAddress()
    pendingCSVFiles = os.listdir(downloadDataPath)
    if(len(pendingCSVFiles) == 0):
        time.sleep(1)
    for fileCSV in pendingCSVFiles:
        currFileDate = getFileDate(fileCSV)
        orderedFilesToUpload = addFileRefToDictionary(fileCSV, currFileDate, orderedFilesToUpload)

    while(len(orderedFilesToUpload) > 0):  
        fileName = orderedFilesToUpload[0]["fileName"]
        filePath = os.path.join(downloadDataPath, fileName)
        downloadSuccess = False
        with open(filePath, 'rb') as f:
            try:
                r = requests.post("http://192.168.100.8:5000/tests/upload", files = {'upload': f})
                if(r.status_code == 200 and r.text == 'file uploaded successfully' and r.reason == 'OK'):
                    print("upload success")
                    downloadSuccess = True
            except:
                print("server unavailable")
        if(downloadSuccess):
            orderedFilesToUpload.remove(orderedFilesToUpload[0])
            os.remove(filePath)
            time.sleep(0.1)
        else: 
            interruption = True
            break
    if(interruption):
        time.sleep(3)
    else:
        time.sleep(1)
    interruption = False

def getFileDate(filePath):
    fileNameParts = filePath.split("_")
    fileYear = int(fileNameParts[0])
    fileMonth = int(fileNameParts[1])
    fileDay = int(fileNameParts[2])
    fileHour = int(fileNameParts[3])
    fileMinutes = int(fileNameParts[4])
    fileSeconds = int(fileNameParts[5])
    fileMillisicends = int(fileNameParts[6])
    fileDateTime = datetime(fileYear, fileMonth, fileDay, fileHour, fileMinutes, fileSeconds, fileMillisicends)
    return fileDateTime

def addFileRefToDictionary(currFilePath, currFileDate, orderedFilesToUpload):
    if(len(orderedFilesToUpload) == 0):
        orderedFilesToUpload.append({ "fileName": currFilePath, "filedate": currFileDate})
        return orderedFilesToUpload
    inserted = False
    for indFile, listFilePath in enumerate(orderedFilesToUpload):
        if(listFilePath["filedate"] > currFileDate):
            orderedFilesToUpload.insert(indFile, { "fileName": currFilePath, "filedate": currFileDate})
            inserted = True
            
    if(inserted == False):
        orderedFilesToUpload.append({ "fileName": currFilePath, "filedate": currFileDate})
    return orderedFilesToUpload