from flask import Flask, render_template, request, url_for, jsonify

import os

import configurator
import databaseServer

def initServer():
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
    databasePath = os.path.join(databaseLocation, serverDataObj.getDatabaseName())
    # database creation (if does not exist)
    databaseServer.createDatabase(databasePath)
    return serverDataObj

initServer()
app = Flask(__name__)



# used for checking if the server is available 
@app.route('/')
def testConnection():
    return 'Server is running'
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
@app.route('/tests/upload', methods = ['GET', 'POST'])
def upload_file():
   if request.method == 'POST':
      print('begin')
      f = request.files['upload']
      f.save(f.filename)
      print('file uploaded successfully')
      return 'file uploaded successfully'

    

