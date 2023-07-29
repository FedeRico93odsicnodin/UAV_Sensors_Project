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
#custom modules 
import dbmodels

DatabaseLocation = ''

def createDatabase(databaseLocation):
    # creation of database only if does not exist
    if(os.path.exists(databaseLocation)):
        return
    
    con = sqlite3.connect(databaseLocation)
    # tables of detected substances in the air 
    sqlite_detectedsubstances_table = """
        CREATE TABLE
        detected_substances(
        id integer PRIMARY KEY,
        name text
        )
"""
    # tables of all the sessions of detection done by the UAV
    sqlite_sessions_table = """
        CREATE TABLE 
        sessions(
        id integer PRIMARY KEY,
        name text,
        begin_date datetime,
        end_date datetime 
        )
"""
    # tables of the sensors used for the analysis
    sqlite_sensors_table = """
        CREATE TABLE
        sensors(
        id integer PRIMARY KEY,
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
            id integer PRIMARY KEY, 
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

def getSensorsDefinitions():
    con = sqlite3.connect(DatabaseLocation)
    cur = con.cursor()
    returnedSensors = []
    sqllite_selectsensors_statement = """
    SELECT 
        id,
        name,
        description,
        gas_detection_ref,
        FROM sensors
"""
    sensorsRecords = cur.fetchall()
    for sensorRow in sensorsRecords:
        currSensorsDefition = dbmodels.SensorObj()
        currSensorsDefition.id = int(sensorRow[0])
        currSensorsDefition.name = str(sensorRow[1])
        currSensorsDefition.descrition = str(sensorRow[2])
        currSensorsDefition.gas_detection_ref = str(sensorRow[3])
        sensorsRecords.append(currSensorsDefition)
    return sensorsRecords
