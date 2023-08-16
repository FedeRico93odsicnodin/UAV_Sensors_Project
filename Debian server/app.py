from flask import Flask, render_template, request, url_for, jsonify
import os
import threading 
from multiprocessing import Process
import json
import configurator
import databaseServer
import processdatasensors

fileUploadPath = ''

def initServer():
    global fileUploadPath
    # getting the current configuration from the xml file 
    serverDataObj = configurator.readConfiguration("serverConf.xml")
    # creation of the data folders for the file csv out and the database storage
    currDir = os.getcwd()
    outputCSVLocation = os.path.join(currDir, serverDataObj.getUploadCSVFolder())
    databaseLocation = os.path.join(currDir, serverDataObj.getProcessedDBFolder())
    if(os.path.exists(databaseLocation) == False):
        os.mkdir(databaseLocation)
    if(os.path.exists(outputCSVLocation) == False):
        os.mkdir(outputCSVLocation)
    fileUploadPath = outputCSVLocation
    databasePath = os.path.join(databaseLocation, serverDataObj.getDatabaseName())
    # database creation (if does not exist)
    databaseServer.createDatabase(databasePath)
    # start thread for monitoring incoming uploads 
    uploadDetectionProcess = Process(target=processdatasensors.dataSensorsElaborateThread, args=(serverDataObj, ))
    uploadDetectionProcess.start()
    return serverDataObj

initServer()
app = Flask(__name__)

# used for checking if the server is available 
@app.route('/')
def testConnection():
    return render_template('index.html')
# POST request test 
@app.route('/tests/endpoint', methods=['POST'])
def endpoint():
    input_json = request.get_json(force=True) 
    # force=True, above, is necessary if another developer 
    # forgot to set the MIME type to 'application/json'
    print('data from client:', input_json)
    dictToReturn = {'answer':42}
    return jsonify(dictToReturn)

# UPLOAD request test
@app.route('/CSV/upload', methods = ['GET', 'POST'])
def upload_file():
   global fileUploadPath
   if request.method == 'POST':
      print('begin')
      f = request.files['upload']
      fileFinalPath = os.path.join(fileUploadPath, f.filename)
      f.save(fileFinalPath)
      print('file ' + f.name + 'has been uploaded successfully')
      return 'file uploaded successfully'

# filters selections
@app.route('/filters/date', methods=['GET'])
def get_range_dates():
    minMaxDates = databaseServer.getRangeDate()
    res = json.dumps(minMaxDates)
    return res

@app.route('/filters/sensors', methods=['GET'])
def get_range_sensors():
    sensors = databaseServer.getSensorsDefinitions()
    objSensors = []
    for s in sensors:
        objSensors.append(sensors[s].sensorObj())
    res = json.dumps(objSensors)
    return res

@app.route('/filters/gases', methods=['GET'])
def get_range_gases():
    compounds = databaseServer.getCompoundsDefinitions()
    objCompounds = []
    for c in compounds:
        objCompounds.append(compounds[c].gasObj())
    res = json.dumps(objCompounds)
    return res
    

@app.route('/filters/sessions', methods=['GET'])
def get_range_sessions():
    allSessions = databaseServer.getAllSessions()
    objSessions = []
    for s in allSessions:
        objSessions.append(allSessions[s].sessionObj())
    res = json.dumps(objSessions)
    return res

@app.route('/filters/allstored', methods=['GET', 'POST'])
def get_all_stored_filters():
    if request.method == "POST":
        filtersJSON = request.get_json()
        filtersToInsert = []
        for f in filtersJSON:
            filtersToInsert.append(filtersJSON[f])
        print(filtersToInsert)
        databaseServer.insertFilterOptions(filtersToInsert)
        return 'ok'
    allFilters = databaseServer.getExistingFilters()
    objFilters = {}
    for f in allFilters:
        objFilters[allFilters[f].filter_name] = allFilters[f].filterObj()
    res = json.dumps(objFilters)
    return res

    

