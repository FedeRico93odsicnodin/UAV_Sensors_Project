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
from threading import Thread
from threading import Lock
#custom modules 
import dbmodels
DatabaseLocation = ''
def createDatabase(databaseLocation):
    global DatabaseLocation
    # creation of database only if does not exist
    if(os.path.exists(databaseLocation)):
        DatabaseLocation = databaseLocation
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
    # creation of options table 
    sqllite_optionsfilters_table = """
    CREATE TABLE
    options_data_filters(
    id integer PRIMARY KEY AUTOINCREMENT,
    selected integer,
    filter_context text,
    filter_name text,
    filter_value text
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
    time.sleep(0.1)
    cur.execute(sqllite_optionsfilters_table)
    con.close()
    DatabaseLocation = databaseLocation
    print('DB LOCATION ' + DatabaseLocation)

def insertCompoundsData(compoundsData):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        sqllite_insertcompounds_statement = "INSERT INTO detected_substances (id, name) VALUES (?, ?);"
        cur.executemany(sqllite_insertcompounds_statement, compoundsData)
        con.commit()
        con.close()

def insertSensorsData(sensorsData):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        sqllite_insertcompounds_statement = """INSERT INTO sensors 
        (id, name, description, gas_detection_ref) VALUES (?, ?, ?, ?);"""
        cur.executemany(sqllite_insertcompounds_statement, sensorsData)
        con.commit()
        con.close()

def addNewSessionValue(sessionName, sessionBeginDate):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        sqllite_insertsession_statement = """INSERT INTO sessions
        (id, name, begin_date, end_date) VALUES (?, ?, ?, ?)"""
        cur.execute(sqllite_insertsession_statement, (None, sessionName, sessionBeginDate, None))
        con.commit()
        con.close()

def insertDataSensor(dataSensedList):
    with Lock():
        global DatabaseLocation 
        con = sqlite3.connect(DatabaseLocation)
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
            dataToInsert.append((None, sensedData.date, sensedData.detected_substance_id, sensedData.detected_substance_val, sensedData.sensor_id, sensedData.session_ref))
        cur.executemany(sqllite_insertdata_statement, dataToInsert)
        con.commit()
        con.close()

# getting all the already stored compounds: 
# data are returned in dictionary definition for easing the comparisons
def getCompoundsDefinitions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
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

def getSensorsDefinitions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqllite_selectsession_statement = """
        SELECT 
            id,
            name,
            description,
            gas_detection_ref
            FROM sensors
    """
        cur = con.execute(sqllite_selectsession_statement)
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

def getAllSessions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqllite_selectallsessions_statement = """SELECT 
        id, 
        name, 
        begin_date,
        end_date
        FROM sessions"""
        cur = con.execute(sqllite_selectallsessions_statement)
        returnedSessions = {}
        allSessions = cur.fetchall()
        try:
            for sessionRecord in allSessions:
                currSession = dbmodels.SessionObj()
                currSession.id = int(sessionRecord[0])
                currSession.name = str(sessionRecord[1])
                datetime1 = sessionRecord[2][:-3]
                currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S.%f')
                if(sessionRecord[3] != None):
                    datetime2 = sessionRecord[3][:-3]
                    currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S.%f')
                returnedSessions[currSession.name] = currSession
            con.close()
            return returnedSessions
        except:
            con.close()
            return None
    return None


def getSensorCurrSession(sessionName):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqllite_selectcompounds_statement = """SELECT 
        id, 
        name, 
        begin_date,
        end_date
        FROM sessions
        WHERE name = """ + "'" + sessionName + "'"
        cur = con.execute(sqllite_selectcompounds_statement)
        sessionRecord = cur.fetchone()
        try:
            currSession = dbmodels.SessionObj()
            currSession.id = int(sessionRecord[0])
            currSession.name = str(sessionRecord[1])
            datetime1 = sessionRecord[2][:-3]
            currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S.%f')
            if(sessionRecord[3] != None):
                datetime2 = sessionRecord[3][:-3]
                currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S.%f')
            con.close()
            return currSession
        except:
            con.close()
            return None
    return None

def getRangeDate():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_daterange_statement = """
        select min(date) from processed_sensors_data dateSelector
        union 
        select max(date) from processed_sensors_data dateSelector
        """
        try:
            cur = con.execute(sqlite_daterange_statement)
            daterange = {}
            minMaxDates = cur.fetchall()
            daterange["minDate"] = minMaxDates[0]
            daterange["maxDate"] = minMaxDates[1]
            con.close()
            return daterange
        except:
            con.close()
            return None
    return None     

def insertFilterOptions(selectedFilters):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_del_oldfilters_statement = """DELETE FROM options_data_filters
        """
        # deletion of old values for the filters 
        cur = con.cursor()
        cur.execute(sqlite_del_oldfilters_statement)
        time.sleep(0.1)
        # creation of the new filters 
        sqllite_insertdata_statement = """INSERT INTO options_data_filters 
        (id, 
        selected, 
        filter_context, 
        filter_name, 
        filter_value) VALUES (?, ?, ?, ?, ?);"""
        dataToInsert = []
        for filterOption in selectedFilters:
            dataToInsert.append((None, int(filterOption["selected"]), str(filterOption["filter_context"]), str(filterOption["filter_name"]), str(filterOption["filter_value"])))
        cur.executemany(sqllite_insertdata_statement, dataToInsert)
        con.commit()
        con.close()

def getExistingFilters():
    global DatabaseLocation
    con = sqlite3.connect(DatabaseLocation)
    sqllite_selectallsessions_statement = """SELECT 
    id, 
    selected, 
    filter_context,
    filter_name,
    filter_value
    FROM options_data_filters"""
    cur = con.execute(sqllite_selectallsessions_statement)
    returnedFilters = {}
    allFilters = cur.fetchall()
    try:
        for filterRecord in allFilters:
            currFilter = dbmodels.FilterObj()
            currFilter.id = int(filterRecord[0])
            currFilter.selected = int(filterRecord[1])
            currFilter.filter_context = str(filterRecord[2])
            currFilter.filter_name = str(filterRecord[3])
            currFilter.filter_value = str(filterRecord[4])
            returnedFilters[currFilter.filter_name] = currFilter
        con.close()
        return returnedFilters
    except:
        con.close()
        return None
    return None


