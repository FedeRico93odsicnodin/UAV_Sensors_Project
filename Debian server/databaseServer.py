#
# Module for database interfacing. It specifies:
# database creation methods
# insert statements 
# query methods for accessing with filters definitions
#
# standard modules 
import sqlite3
import os
import time 
from datetime import datetime 
#custom modules 
import dbmodels

def createDatabase(databaseLocation):
    # creation of database only if does not exist
    if(os.path.exists(databaseLocation)):
        return
    
    con = sqlite3.connect(databaseLocation)
    # tables of detected substances in the air 
    sqlite_detectedsubstances_table = """
        CREATE TABLE
        detected_substances(
        id integer PRIMARY KEY AUTOINCREMENT,
        name text
        )
"""
    # tables of all the sessions of detection done by the UAV
    sqlite_sessions_table = """
        CREATE TABLE 
        sessions(
        id integer PRIMARY KEY AUTOINCREMENT,
        name text,
        begin_date datetime,
        end_date datetime 
        )
"""
    # tables of the sensors used for the analysis
    sqlite_sensors_table = """
        CREATE TABLE
        sensors(
        id integer PRIMARY KEY AUTOINCREMENT,
        name text,
        description text,
        gas_detection_ref integer,
        FOREIGN KEY (gas_detection_ref) REFERENCES detected_substances (id)
        )
"""
    # all the rows which identifies the data coming from the sensors 
    sqllite_sensorsdata_table = """
        CREATE TABLE 
        processed_sensors_data(
            id integer PRIMARY KEY AUTOINCREMENT, 
            date datetime, 
            detected_substance_ref integer,
            detected_substance_value real,
            sensor_ref integer,
            session_ref integer,
            FOREIGN KEY (sensor_ref) REFERENCES sensors (id),
            FOREIGN KEY (session_ref) REFERENCES sessions (id)
            FOREIGN KEY (detected_substance_ref) REFERENCES detected_substances (id)
            )
            """
    cur = con.cursor()
    cur.execute(sqlite_detectedsubstances_table)
    time.sleep(0.1)
    cur.execute(sqlite_sessions_table)
    time.sleep(0.1)
    cur.execute(sqlite_sensors_table)
    time.sleep(0.1)
    cur.execute(sqllite_sensorsdata_table)
    con.close()
    DatabaseLocation = databaseLocation
    print('DB LOCATION ' + DatabaseLocation)

def insertCompoundsData(databaseLocation, compoundsData):
    con = sqlite3.connect(databaseLocation)
    cur = con.cursor()
    sqllite_insertcompounds_statement = "INSERT INTO detected_substances (id, name) VALUES (?, ?);"
    cur.executemany(sqllite_insertcompounds_statement, compoundsData)
    con.commit()
    con.close()

def insertSensorsData(databaseLocation, sensorsData):
    con = sqlite3.connect(databaseLocation)
    cur = con.cursor()
    sqllite_insertcompounds_statement = """INSERT INTO sensors 
    (id, name, description, gas_detection_ref) VALUES (?, ?, ?, ?);"""
    cur.executemany(sqllite_insertcompounds_statement, sensorsData)
    con.commit()
    con.close()

def addNewSessionValue(databaseLocation, sessionName, sessionBeginDate):
    con = sqlite3.connect(databaseLocation)
    cur = con.cursor()
    sqllite_insertsession_statement = """INSERT INTO sessions
    (id, name, begin_date, end_date) VALUES (?, ?, ?, ?)"""
    cur.execute(sqllite_insertsession_statement, (None, sessionName, sessionBeginDate, None))
    con.commit()
    con.close()

def insertDataSensor(databaseLocation, dataSensedList):
    con = sqlite3.connect(databaseLocation)
    cur = con.cursor()
    sqllite_insertdata_statement = """INSERT INTO processed_sensors_data 
    (id, 
    date, 
    detected_substance_ref, 
    detected_substance_value, 
    sensor_ref, 
    session_ref) VALUES (?, ?, ?, ?, ?, ?);"""
    dataToInsert = []
    for sensedData in dataSensedList:
        dataToInsert.add(None, dataToInsert.date, dataToInsert.detected_substance_id, dataToInsert.detected_substance_val, dataToInsert.sensor_id, dataToInsert.session_ref)
    cur.execute(sqllite_insertdata_statement, sensedData)
    con.commit()
    con.close()

# getting all the already stored compounds: 
# data are returned in dictionary definition for easing the comparisons
def getCompoundsDefinitions(databaseLocation):
    con = sqlite3.connect(databaseLocation)
    sqllite_selectcompounds_statement = "SELECT id, name FROM detected_substances"
    cur = con.execute(sqllite_selectcompounds_statement)
    returnedCompounds = {}
    
    compoundsRecords = cur.fetchall()
    for compRec in compoundsRecords:
        currCompObj = dbmodels.CompoundObj()
        currCompObj.id = int(compRec[0])
        currCompObj.name = str(compRec[1])
        returnedCompounds[currCompObj.name] = currCompObj
    con.close()
    return returnedCompounds

def getSensorsDefinitions(databaseLocation):
    con = sqlite3.connect(databaseLocation)
    sqllite_selectsensors_statement = """
    SELECT 
        id,
        name,
        description,
        gas_detection_ref
        FROM sensors
"""
    cur = con.execute(sqllite_selectsensors_statement)
    returnedSensors = {}
    
    sensorsRecords = cur.fetchall()
    for sensorRow in sensorsRecords:
        currSensorsDefition = dbmodels.SensorObj()
        currSensorsDefition.id = int(sensorRow[0])
        currSensorsDefition.name = str(sensorRow[1])
        currSensorsDefition.descrition = str(sensorRow[2])
        currSensorsDefition.gas_detection_ref = str(sensorRow[3])
        returnedSensors[currSensorsDefition.name] = currSensorsDefition
    con.close()
    return returnedSensors

def getSensorCurrSession(databaseLocation, sessionName):
    con = sqlite3.connect(databaseLocation)
    sqllite_selectcompounds_statement = """SELECT 
    id, 
    name, 
    begin_date,
    end_date
    FROM sessions
    WHERE name = """ + "'" + sessionName + "'"
    cur = con.execute(sqllite_selectcompounds_statement)
    sessionRecord = cur.fetchone()
    print(sessionRecord)
    try:
        currSession = dbmodels.SessionObj()
        currSession.id = int(sessionRecord[0])
        currSession.name = str(sessionRecord[1])
        datetime1 = sessionRecord[2][:-3]
        currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S.%f')
        if(sessionRecord[3] != None):
            datetime2 = sessionRecord[3][:-3]
            currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S.%f')
        return currSession
    except:
        con.close()
        return None
    con.close()
    return None



