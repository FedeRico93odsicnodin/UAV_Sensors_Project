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
    # creation of the RL persistance table 
    sqlite_r0resistors_table = """
    CREATE TABLE 
    rzero_resistors(
    id integer PRIMARY KEY AUTOINCREMENT,
    sensor_ref integer,
    rzero_value real, 
    FOREIGN KEY (sensor_ref) REFERENCES sensors (id)
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
    time.sleep(0.1)
    cur.execute(sqlite_r0resistors_table)
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
                datetime1 = str(sessionRecord[2]) + ".000"
                print(datetime1)
                currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S.%f')
                if(sessionRecord[3] != None):
                    datetime2 = str(sessionRecord[3]) + ".000"
                    currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S.%f')
                returnedSessions[currSession.name] = currSession
            con.close()
            return returnedSessions
        except:
            print('session error')
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
            datetime1 = sessionRecord[2]
            currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S')
            if(sessionRecord[3] != None):
                datetime2 = sessionRecord[3]
                currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S')
            con.close()
            return currSession
        except:
            print('error DB')
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

def insertFilterOptions(selectedFilters, delete = True):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_del_oldfilters_statement = """DELETE FROM options_data_filters
        """
        # deletion of old values for the filters 
        cur = con.cursor()
        if(delete == True):
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
    with Lock():
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

# data selections based on filters 
# checking if the gas is selected in filters 
def checkFilterActivatedOnGas(gasName, gasId):
     with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_activefilter_statement = "SELECT selected FROM options_data_filters WHERE filter_name = '" + gasName + "' AND filter_value = " + str(gasId) + " AND filter_context = 'Gases'"
        cur = con.execute(sqlite_activefilter_statement)
        gasRecord = cur.fetchone()
        try:
            if(gasRecord[0] == 1):
                con.close()
                return True
            con.close()
            return False
        except:
            con.close()
            return False
        return False
     
# checking if the sensor for the selected gas is selected in filters 
def checkFilterActivateOnSensor(gasName, gasId):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_activefilter_statement = """
                SELECT selected from options_data_filters
                WHERE filter_name IN
                (SELECT sensors.name from sensors JOIN detected_substances
                ON sensors.gas_detection_ref = detected_substances.id 
                WHERE detected_substances.name = ? AND detected_substances.id = ?)
                AND filter_value in (SELECT sensors.id from sensors JOIN detected_substances
                ON sensors.gas_detection_ref = detected_substances.id 
                WHERE detected_substances.name = ? AND detected_substances.id = ?)
                """
        cur = con.execute(sqlite_activefilter_statement, (gasName, gasId, gasName, gasId))
        gasRecord = cur.fetchone()
        try:
            if(gasRecord[0] == 1):
                con.close()
                return True
            con.close()
            return False
        except:
            con.close()
            return False
        return False

# getting the active filters for the date 
def getActiveDataFilters():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_activefilter_statement = """
        SELECT id, selected, filter_context, filter_name, filter_value FROM options_data_filters
        WHERE filter_context = 'Date' and selected = 1
"""
        returnedFilters = {}
        cur = con.execute(sqlite_activefilter_statement)
        dateRecords = cur.fetchall()
        try:
            for filterRecord in dateRecords:
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

# getting all the data for the selected gas 
def getAllDataSensorsToDisplay(gasId, dateSelectionType = 'None', dateRangeMin = None, dateRangeMax = None):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_dataselection_statement = """
        SELECT 
        processed_sensors_data.date
        ,processed_sensors_data.detected_substance_value
        ,sessions.name
        , sessions.id
        FROM processed_sensors_data
        JOIN sessions on processed_sensors_data.session_ref = sessions.id
        WHERE processed_sensors_data.detected_substance_ref = ?
        AND processed_sensors_data.session_ref in (SELECT 
        filter_value FROM options_data_filters WHERE filter_context='Sessions' AND selected = 1)
        ORDER BY sessions.id,processed_sensors_data.date 
"""
        # modification of the query for the selected data case TODO: implementation 
        if(dateSelectionType == 'This week'):
            sqlite_dataselection_statement = 'to implement'
        if(dateSelectionType == 'This month'):
            sqlite_dataselection_statement = 'to implement'
        if(dateSelectionType == 'Today'):
            sqlite_dataselection_statement = 'to implement'
        if(dateSelectionType == 'Custom' and dateRangeMin != None and dateRangeMax != None):
            sqlite_dataselection_statement = 'to implement'
        if(dateSelectionType == 'None'):
            cur = con.execute(sqlite_dataselection_statement, (gasId,))
        returnedData = []
        dataRecords = cur.fetchall()
        for filterRecord in dataRecords:
            currDataObj = {}
            currDataObj['date'] = filterRecord[0]
            currDataObj['value'] = float(filterRecord[1])
            currDataObj['session'] = str(filterRecord[2])
            currDataObj['sessionID'] = int(filterRecord[3])
            returnedData.append(currDataObj)
        
        con.close()
    return dataRecords
# getting session data on reload 
def getAllDataSensorsToDisplayReload(
        gasId, 
        dateUpLimit,
        dateSelectionType = 'None', 
        dateRangeMin = None, 
        dateRangeMax = None):
    with Lock():
         global DatabaseLocation
         con = sqlite3.connect(DatabaseLocation)
         sqlite_dataselection_statement = """
            SELECT 
            processed_sensors_data.date
            ,processed_sensors_data.detected_substance_value
            ,sessions.name
            , sessions.id
            FROM processed_sensors_data
            JOIN sessions on processed_sensors_data.session_ref = sessions.id
            WHERE processed_sensors_data.detected_substance_ref = ?
            AND processed_sensors_data.session_ref in (SELECT 
            filter_value FROM options_data_filters WHERE filter_context='Sessions' AND selected = 1)
            AND processed_sensors_data.date > ?
            ORDER BY sessions.id,processed_sensors_data.date 
    """
         # modification of the query for the selected data case TODO: implementation 
         if(dateSelectionType == 'This week'):
            sqlite_dataselection_statement = 'to implement'
         if(dateSelectionType == 'This month'):
            sqlite_dataselection_statement = 'to implement'
         if(dateSelectionType == 'Today'):
            sqlite_dataselection_statement = 'to implement'
         if(dateSelectionType == 'Custom' and dateRangeMin != None and dateRangeMax != None):
            sqlite_dataselection_statement = 'to implement'
         if(dateSelectionType == 'None'):
            cur = con.execute(sqlite_dataselection_statement, (gasId,dateUpLimit))
         returnedData = []
         dataRecords = cur.fetchall()
         for filterRecord in dataRecords:
            currDataObj = {}
            currDataObj['date'] = filterRecord[0]
            currDataObj['value'] = float(filterRecord[1])
            currDataObj['session'] = str(filterRecord[2])
            currDataObj['sessionID'] = int(filterRecord[3])
            returnedData.append(currDataObj)
         con.close()
    return dataRecords

def getDataSensorsToDownload():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        # v1: selection of all the available data 
        sqlite_dataselection_statement = """
        SELECT 
        processed_sensors_data.date
		, detected_substances.name
        ,processed_sensors_data.detected_substance_value
		, sensors.name
		, sessions.name
        FROM processed_sensors_data
        JOIN sessions on processed_sensors_data.session_ref = sessions.id
		JOIN detected_substances on processed_sensors_data.detected_substance_ref = detected_substances.id
		JOIN sensors on processed_sensors_data.sensor_ref = sensors.id
        WHERE 
		processed_sensors_data.session_ref in (SELECT 
        filter_value FROM options_data_filters WHERE filter_context='Sessions' AND selected = 1)
        ORDER BY processed_sensors_data.date,sessions.id
"""
        cur = con.execute(sqlite_dataselection_statement)
        dataRecords = cur.fetchall()
        returnedData = []
        for filterRecord in dataRecords:
            currDataObj = {}
            currDataObj['date'] = filterRecord[0]
            currDataObj['substance'] = str(filterRecord[1])
            if(str(filterRecord[2]) == ''):
                currDataObj['value'] = None
            else:
                currDataObj['value'] = float(filterRecord[2])
            currDataObj['sensor'] = str(filterRecord[3])
            currDataObj['session'] = str(filterRecord[4])
            returnedData.append(currDataObj)
        con.close()
    return returnedData
# inserting or updating the current r0 value used for calibrating 
def update_rzero_value(sensorId, resistanceValue):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        # checking the presence of an entry for the sensor and the current value of r0
        sqlite_check_statement = "SELECT COUNT(*) FROM rzero_resistors WHERE sensor_ref = ?"
        cur = con.execute(sqlite_check_statement, (sensorId,))
        valuePresence = cur.fetchone()
        if(valuePresence[0] == 0):
            # inserting the first value in the table 
            sqlite_insert_rzero_statement = """
            INSERT INTO rzero_resistors 
                    (id, 
                    sensor_ref, 
                    rzero_value) VALUES 
                    (?, ?, ?);
"""
            cur = con.execute(sqlite_insert_rzero_statement, (None, sensorId, resistanceValue))
            con.commit()
            con.close()
            return
        sqlite_update_rzero_statement = """
        UPDATE rzero_resistors SET rzero_value = ? WHERE sensor_ref = ?
"""
        cur = con.execute(sqlite_update_rzero_statement, (resistanceValue, sensorId))
        con.commit()
        con.close()
# selecting the current resistances r0 to be used in the calibration process 
def get_rzero_values():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_sel_resistances = """
            SELECT 
            rzero_resistors.id, 
            rzero_resistors.sensor_ref, 
            sensors.name,
            rzero_resistors.rzero_value 
            FROM rzero_resistors JOIN sensors ON rzero_resistors.sensor_ref = sensors.id 
"""
        cur = con.execute(sqlite_sel_resistances)
        resistanceRecords = cur.fetchall()
        allRZeroObjects = {}
        for resRecord in resistanceRecords:
            currRZeroObj = dbmodels.RZeroResistance()
            currRZeroObj.id = int(resRecord[0])
            currRZeroObj.sensor_ref = int(resRecord[1])
            currRZeroObj.sensor_name = str(resRecord[2])
            currRZeroObj.resValue = float(resRecord[3])
            allRZeroObjects[currRZeroObj.sensor_name] = currRZeroObj
    return allRZeroObjects


