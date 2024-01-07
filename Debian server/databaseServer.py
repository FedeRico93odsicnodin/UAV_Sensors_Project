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
    # it is also added a new property for persisting the given value by FE
    create_gases_table = """
        CREATE TABLE
        detected_substances(
        id integer PRIMARY KEY AUTOINCREMENT,
        name text,
        color text
        )
"""
    # tables of all the sessions of detection done by the UAV
    create_sessions_table = """
        CREATE TABLE 
        sessions(
        id integer PRIMARY KEY AUTOINCREMENT,
        name text,
        begin_date datetime,
        end_date datetime 
        )
"""
    # tables of the sensors used for the analysis
    create_sensors_table = """
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
    create_data_table = """
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
    # creating the table for the different visualization types 
    # seconds visualization
    create_data_table_vis = """
        CREATE TABLE 
        processed_sensors_data_vis(
            id integer PRIMARY KEY AUTOINCREMENT, 
            date datetime, 
            detected_substance_ref integer,
            detected_substance_value real,
            sensor_ref integer,
            session_ref integer,
            vis_granularity text,
            vis_lbl text,
            FOREIGN KEY (sensor_ref) REFERENCES sensors (id),
            FOREIGN KEY (session_ref) REFERENCES sessions (id)
            FOREIGN KEY (detected_substance_ref) REFERENCES detected_substances (id)
            )
"""
    # creation of options table 
    create_filters_table = """
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
    create_r0resistors_table = """
    CREATE TABLE 
    rzero_resistors(
    id integer PRIMARY KEY AUTOINCREMENT,
    sensor_ref integer,
    rzero_value real, 
    FOREIGN KEY (sensor_ref) REFERENCES sensors (id)
    )
"""
    # creation of the table for the current visualized elements 
    create_dashboard_visualized_graphs_table = """
    CREATE TABLE 
    dashboard_visualized(
    id integer PRIMARY KEY AUTOINCREMENT,
    session_ref integer,
    gas_ref integer,
    vis_type integer,
    vis_granularity text,
    is_visualized integer,
    FOREIGN KEY (session_ref) REFERENCES sessions (id),
    FOREIGN KEY (gas_ref) REFERENCES detected_substances (id)
    )
"""
    cur = con.cursor()
    cur.execute(create_gases_table)
    time.sleep(0.1)
    cur.execute(create_sessions_table)
    time.sleep(0.1)
    cur.execute(create_sensors_table)
    time.sleep(0.1)
    cur.execute(create_data_table)
    time.sleep(0.1)
    cur.execute(create_data_table_vis)
    time.sleep(0.1)
    cur.execute(create_filters_table)
    time.sleep(0.1)
    cur.execute(create_r0resistors_table)
    time.sleep(0.1)
    cur.execute(create_dashboard_visualized_graphs_table)
    con.close()
    DatabaseLocation = databaseLocation
    #print('DB LOCATION ' + DatabaseLocation)

def insertCompoundsData(compoundsData):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        insert_compounds_query = "INSERT INTO detected_substances (id, name, color) VALUES (?, ?, ?);"
        cur.executemany(insert_compounds_query, compoundsData)
        con.commit()
        con.close()

def insertSensorsData(sensorsData):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        insert_sensors_query = """INSERT INTO sensors 
        (id, name, description, gas_detection_ref) VALUES (?, ?, ?, ?);"""
        cur.executemany(insert_sensors_query, sensorsData)
        con.commit()
        con.close()

def addNewSessionValue(sessionName, sessionBeginDate):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        insert_sessions_query = """INSERT INTO sessions
        (id, name, begin_date, end_date) VALUES (?, ?, ?, ?)"""
        cur.execute(insert_sessions_query, (None, sessionName, sessionBeginDate, None))
        con.commit()
        con.close()

def insertDataSensor(dataSensedList):
    with Lock():
        global DatabaseLocation 
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        insert_data_query = """INSERT INTO processed_sensors_data 
        (id, 
        date, 
        detected_substance_ref, 
        detected_substance_value, 
        sensor_ref, 
        session_ref) VALUES (?, ?, ?, ?, ?, ?);"""
        dataToInsert = []
        for sensedData in dataSensedList:
            dataToInsert.append((
                None, 
                sensedData.date, 
                sensedData.detected_substance_id, 
                sensedData.detected_substance_val, 
                sensedData.sensor_id, 
                sensedData.session_ref))
        cur.executemany(insert_data_query, dataToInsert)
        con.commit()
        con.close()

# getting all the already stored compounds: 
# data are returned in dictionary definition for easing the comparisons
def getCompoundsDefinitions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_gases_query = "SELECT id, name, color FROM detected_substances"
        cur = con.execute(sel_gases_query)
        returnedCompounds = {}
        
        compoundsRecords = cur.fetchall()
        for compRec in compoundsRecords:
            #print(compRec)
            currCompObj = dbmodels.CompoundObj()
            currCompObj.id = int(compRec[0])
            currCompObj.name = str(compRec[1])
            currCompObj.color = str(compRec[2])
            returnedCompounds[currCompObj.name] = currCompObj
        con.close()
    return returnedCompounds

def getSensorsDefinitions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_sensors_query = """
        SELECT 
            sensors.id,
            sensors.name,
            sensors.description,
            sensors.gas_detection_ref,
			(select min(detected_substance_value) from processed_sensors_data where processed_sensors_data.sensor_ref = sensors.id),
			(select max(detected_substance_value) from processed_sensors_data where processed_sensors_data.sensor_ref = sensors.id),
			(select avg(detected_substance_value) from processed_sensors_data where processed_sensors_data.sensor_ref = sensors.id)
            FROM sensors
    """
        cur = con.execute(sel_sensors_query)
        returnedSensors = {}
        
        sensorsRecords = cur.fetchall()
        for sensorRow in sensorsRecords:
            currSensorsDefition = dbmodels.SensorObj()
            currSensorsDefition.id = int(sensorRow[0])
            currSensorsDefition.name = str(sensorRow[1])
            currSensorsDefition.descrition = str(sensorRow[2])
            currSensorsDefition.gas_detection_ref = str(sensorRow[3])
            if(sensorRow[4] != None):
                currSensorsDefition.minVal = float(sensorRow[4])
            if(sensorRow[5] != None):
                currSensorsDefition.maxVal = float(sensorRow[5])
            if(sensorRow[6] != None):
                currSensorsDefition.avgVal = float(sensorRow[6])
            returnedSensors[currSensorsDefition.name] = currSensorsDefition
        con.close()
    return returnedSensors

def getAllSessions():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_sessions_query = """SELECT 
        id, 
        name, 
        begin_date,
        end_date
        FROM sessions"""
        cur = con.execute(sel_sessions_query)
        returnedSessions = {}
        allSessions = cur.fetchall()
        try:
            for sessionRecord in allSessions:
                currSession = dbmodels.SessionObj()
                currSession.id = int(sessionRecord[0])
                currSession.name = str(sessionRecord[1])
                datetime1 = str(sessionRecord[2]) + ".000"
                #print(datetime1)
                currSession.begin_date = datetime.strptime(datetime1, '%Y-%m-%d %H:%M:%S.%f')
                if(sessionRecord[3] != None):
                    datetime2 = str(sessionRecord[3]) + ".000"
                    currSession.end_date =  datetime.strptime(datetime2, '%Y-%m-%d %H:%M:%S.%f')
                returnedSessions[currSession.name] = currSession
            con.close()
            return returnedSessions
        except:
            #print('session error')
            con.close()
            return None
    return None


def getSensorCurrSession(sessionName):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_curr_session_query = """SELECT 
        id, 
        name, 
        begin_date,
        end_date
        FROM sessions
        WHERE name = """ + "'" + sessionName + "'"
        cur = con.execute(sel_curr_session_query)
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
            #print('error DB')
            con.close()
            return None
    return None

def getRangeDate():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_daterange_query = """
        select min(date) from processed_sensors_data dateSelector
        union 
        select max(date) from processed_sensors_data dateSelector
        """
        try:
            cur = con.execute(sel_daterange_query)
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
        del_filters_query = """DELETE FROM options_data_filters
        """
        # deletion of old values for the filters 
        cur = con.cursor()
        if(delete == True):
            cur.execute(del_filters_query)
            time.sleep(0.1)
        
        # creation of the new filters 
        insert_filters_query = """INSERT INTO options_data_filters 
        (id, 
        selected, 
        filter_context, 
        filter_name, 
        filter_value) VALUES (?, ?, ?, ?, ?);"""
        dataToInsert = []
        for filterOption in selectedFilters:
            dataToInsert.append((
                None, 
                int(filterOption["selected"]), 
                str(filterOption["filter_context"]), 
                str(filterOption["filter_name"]).replace(' ', 'e'), 
                str(filterOption["filter_value"])))
        cur.executemany(insert_filters_query, dataToInsert)
        con.commit()
        con.close()

def getExistingFilters():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sel_filters_query = """SELECT 
        id, 
        selected, 
        filter_context,
        filter_name,
        filter_value
        FROM options_data_filters"""
        cur = con.execute(sel_filters_query)
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
     gasName = str(gasName).replace(' ', 'e')
     #print('gasName: ' + str(gasName) + ' - gasId: ' + str(gasId))
     with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        check_gasfilter_query = "SELECT selected FROM options_data_filters WHERE filter_name = '" + gasName + "' AND filter_value = " + str(gasId) + " AND filter_context = 'Gases'"
        #print('QUERY CHECK: ' + check_gasfilter_query)
        cur = con.execute(check_gasfilter_query)
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
        check_sensorfilter_query = """
                SELECT selected from options_data_filters
                WHERE filter_name IN
                (SELECT sensors.name from sensors JOIN detected_substances
                ON sensors.gas_detection_ref = detected_substances.id 
                WHERE detected_substances.name = ? AND detected_substances.id = ?)
                """
        #print('EXECUTED QUERY FOR SENSORS:\n\n' + str(check_sensorfilter_query))
        cur = con.execute(check_sensorfilter_query, (str(gasName).replace(' ', 'e'), gasId))
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
        sel_active_data_filter_query = """
        SELECT id, selected, filter_context, filter_name, filter_value FROM options_data_filters
        WHERE filter_context = 'Date' and selected = 1
"""
        returnedFilters = {}
        cur = con.execute(sel_active_data_filter_query)
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
        sel_data_query = """
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
            sel_data_query = 'to implement'
        if(dateSelectionType == 'This month'):
            sel_data_query = 'to implement'
        if(dateSelectionType == 'Today'):
            sel_data_query = 'to implement'
        if(dateSelectionType == 'Custom' and dateRangeMin != None and dateRangeMax != None):
            sel_data_query = 'to implement'
        if(dateSelectionType == 'None'):
            cur = con.execute(sel_data_query, (gasId,))
        returnedData = []
        dataRecords = cur.fetchall()
        for filterRecord in dataRecords:
            currDataObj = {}
            currDataObj['date'] = str(filterRecord[0])[0:-3]
            if(filterRecord[1] != ''):
                currDataObj['value'] = float(filterRecord[1])
            else: currDataObj['value'] = 0
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
         sel_data_query = """
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
            sel_data_query = 'to implement'
         if(dateSelectionType == 'This month'):
            sel_data_query = 'to implement'
         if(dateSelectionType == 'Today'):
            sel_data_query = 'to implement'
         if(dateSelectionType == 'Custom' and dateRangeMin != None and dateRangeMax != None):
            sel_data_query = 'to implement'
         if(dateSelectionType == 'None'):
            cur = con.execute(sel_data_query, (gasId,dateUpLimit))
         returnedData = []
         dataRecords = cur.fetchall()
         for filterRecord in dataRecords:
            currDataObj = {}
            currDataObj['date'] = str(filterRecord[0])[0:-3]
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
        sel_data_download_query = """
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
        cur = con.execute(sel_data_download_query)
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
        sel_resistance_query = """
            SELECT 
            rzero_resistors.id, 
            rzero_resistors.sensor_ref, 
            sensors.name,
            rzero_resistors.rzero_value 
            FROM rzero_resistors JOIN sensors ON rzero_resistors.sensor_ref = sensors.id 
"""
        cur = con.execute(sel_resistance_query)
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

# Methods of version SensServerUAV_v1
# allows to update the color for which the gas is represented graphically
def updateGasColorDefinition(gasId, gasNewColor):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_update_gascolor_statement = "UPDATE detected_substances SET color = '" + gasNewColor + "' WHERE id = " + str(gasId)
        cur = con.execute(sqlite_update_gascolor_statement)
        con.commit()
        con.close()
        #print('execute statement ')

# method for getting the current formatted date for sqlite starting from a date of type 
# 2 - Thu Dec 07 2023 09:59:00 GMT+0100 (Central European Standard Time)
def getFormattedSQLiteDate(modifiedDateObj):
    ""

# allow to save the new information for the session initial date modification 
def updateDateSessionWithModifiedDate(sessionId, modifiedDateObj):
    with Lock():
        global DatabaseLocation
        sessionNewName = 'session started in ' + str(modifiedDateObj)
        con = sqlite3.connect(DatabaseLocation)
        sqlite_update_session_statement = "UPDATE sessions SET name = '" + sessionNewName + "', begin_date = '" + str(modifiedDateObj) + "' WHERE id = " + str(sessionId)
        cur = con.execute(sqlite_update_session_statement)
        con.commit()
        con.close()
        # print('execute statement ')

# allow the modification for all the points of the session with an alignment to the modified date
def alignPointsSessionWithModifiedDate(sessionId, modifiedDateObj):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_update_datanewdate_statement = """
        update processed_sensors_data set date = (datetime
            (
                (JulianDay(date) + (JulianDay('{0}') 
                - Julianday((select date from processed_sensors_data where session_ref = {1} order by date LIMIT 1)))
            )) || substr(date, instr(date, '.')))
        where session_ref = {1}
"""
        sqlite_update_datanewdate_statement = sqlite_update_datanewdate_statement.format(str(modifiedDateObj), str(sessionId))
        cur = con.execute(sqlite_update_datanewdate_statement)
        con.commit()
        con.close()
        # print('execute statement UPDATE POINTS date')

##### REGULATING OUTLIERS METHODS #####
# getting all the outliers up to a certain value for a certain substance 
def getAllOutliersFromLowerLimitForSensor(sensorId, lowerBound):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_alloutliers_statement = """
        select id, detected_substance_value 
        from processed_sensors_data
        where sensor_ref = ?
        and detected_substance_value > ?
"""
        cur = con.execute(sqlite_alloutliers_statement, (sensorId, lowerBound))
        outliersRecords = cur.fetchall()
        returnedData = []
        for outlierRecord in outliersRecords:
            currOutlierObj = {}
            currOutlierObj['id'] = int(outlierRecord[0])
            currOutlierObj['sensedVal'] = float(outlierRecord[1])
            returnedData.append(currOutlierObj)
        con.close()
        return returnedData

# getting the nearest lower value to the selected outlier and for the certain sensor 
def getNearestValueToOutlierLower(sensorId, outlierId):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_nearest_min_sel = """
        select id, detected_substance_value 
        from processed_sensors_data
        where 
        sensor_ref = ? and id < ?
        order by id desc 
        limit 1
"""
        cur = con.execute(sqlite_nearest_min_sel, (sensorId, outlierId))
        nearestLowerDb = cur.fetchone()
        nearestLower = {"id": None, "sensedValue": None }
        if(nearestLowerDb != None):
            nearestLower["id"] = int(nearestLowerDb[0])
            nearestLower["sensedValue"] = float(nearestLowerDb[1])
        return nearestLower

# getting the nearest upper value to the selected outlier and for the certain sensor 
def getNearestValueToOutlierUpper(sensorId, outlierId):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_nearest_max_sel = """
        select id, detected_substance_value 
        from processed_sensors_data
        where 
        sensor_ref = ? and id > ?
        order by id asc
        limit 1
"""
        cur = con.execute(sqlite_nearest_max_sel, (sensorId, outlierId))
        nearestUpperDb = cur.fetchone()
        nearestUpper = {"id": None, "sensedValue": None }
        if(nearestUpperDb != None):
            nearestUpper["id"] = int(nearestUpperDb[0])
            nearestUpper["sensedValue"] = float(nearestUpperDb[1])
        return nearestUpper

# updating the new calculated value for the current outlier 
def updateOutlierValue(outlierId, newSensedValue):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_update_outlier_statement = """
        update processed_sensors_data set detected_substance_value = ?
        where id = ?"""
        cur = con.execute(sqlite_update_outlier_statement, (newSensedValue, outlierId))
        con.commit()
        con.close()

######### DASHBOARD GRAPHS VISUALIZATION ##########
# checking for the presence of the current visualization type 
def checkInfoCurrVisualizationPresence(sessionId, gasId):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_check_dashboard_el = """
        select count(*) from dashboard_visualized 
        where session_ref = ?
        and gas_ref = ?
"""
        cur = con.execute(sqlite_check_dashboard_el, (sessionId, gasId))
        dashboardCreated = cur.fetchone()
        if(dashboardCreated != None):
            numEntries = int(dashboardCreated[0])
            if(numEntries > 0):
                return True
        return False

# inserting the definition for the current gas visualization and the updated session 
def insertCurrGasGraphVisualDefinition(graphVisualizationObj):
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        cur = con.cursor()
        sqlite_insert_dashboard_def = """
        insert into dashboard_visualized (
            id, 
            session_ref, 
            gas_ref,
            vis_type,
            vis_granularity,
            is_visualized) 
            VALUES (
                ?, 
                ?, 
                ?,
                ?,
                ?,
                ?);
"""
        cur.execute(sqlite_insert_dashboard_def, (
            None, 
            graphVisualizationObj.session_ref, 
            graphVisualizationObj.gas_ref, 
            graphVisualizationObj.vis_type,
            graphVisualizationObj.vis_granularity,
            graphVisualizationObj.is_visualized
            ))
        con.commit()
        con.close()

# getting all the objects with an active visualization to give back to the FE in a set of points  
def checkGasDashboardVisualization():
    with Lock():
        global DatabaseLocation
        con = sqlite3.connect(DatabaseLocation)
        sqlite_all_el_to_visualize_query = """SELECT
        dashboard_visualized.id, 
        dashboard_visualized.session_ref,
        dashboard_visualized.gas_ref,
        dashboard_visualized.vis_type,
        dashboard_visualized.vis_granularity,
        optgas.filter_name,
        dashboard_visualized.is_visualized
        FROM options_data_filters as optgas 
        join dashboard_visualized on dashboard_visualized.gas_ref = optgas.filter_value
        join options_data_filters as optsession on dashboard_visualized.session_ref = optsession.filter_value
        where 
        optgas.filter_context = 'Gases'
        and optsession.filter_context = 'Sessions'
        and optgas.selected = 1
        and optsession.selected = 1"""
        cur = con.execute(sqlite_all_el_to_visualize_query)
        dashboardObjVis = cur.fetchall()
        returnedData = []
        if(dashboardObjVis != None):
            for dashboardRecord in dashboardObjVis:
                currDataObj = dbmodels.DashboardCurrVisualzed()
                currDataObj.id = int(dashboardRecord[0])
                currDataObj.session_ref = int(dashboardRecord[1])
                currDataObj.gas_ref = int(dashboardRecord[2])
                currDataObj.vis_type = int(dashboardRecord[3])
                currDataObj.vis_granularity = str(dashboardRecord[4])
                currDataObj.gas_name = str(dashboardRecord[5])
                returnedData.append(currDataObj)
        con.close()
    return returnedData

# getting the set of all the points for a particular substance and session to visualize
# in context of data load or reload 
def getAllPointsToVisualize(gasId, sessionId, vis_type, vis_granularity):
    print("TODO: implementation of getting the point of visualization type basis")