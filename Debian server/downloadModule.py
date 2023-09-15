#
# Module for downloading displayed information 
#
import databaseServer
import xlsxwriter
import os
# definition of the column set for the excel to create 
column = {
        "date" : 0
        
    }
def createXLSXFile(worksheetDestination):
    # getting the data to append to xlsx file 
    currDataDownlaod = databaseServer.getDataSensorsToDownload()
    # creation of the Excel file 
    currExcel = os.path.join(worksheetDestination, "SensorsData.xlsx")
    # cancelling previous created file 
    if(os.path.exists(currExcel)):
        os.remove(currExcel)
    workbook = xlsxwriter.Workbook(currExcel)
    worksheet = workbook.add_worksheet("SensorsAllData")

    # creation of the column header
    createExcelHeader(worksheet, currDataDownlaod)
    # insertion of the values 
    writeExcelSensorDataValue(worksheet, currDataDownlaod)
    # closing file 
    workbook.close()

def createExcelHeader(worksheet, currDataDownload):
    row = 0
    global column
    startingCol = 1
    # header addtion for the couple gas_sensor
    for currRowData in currDataDownload:
        currGasSensName = currRowData['substance'] + "_" + currRowData['sensor']
        if(currGasSensName in column): continue
        column[currGasSensName] = startingCol
        startingCol = startingCol + 1
    # inserting the session at the end of the columns
    column['session'] = startingCol
    # writing the headers on file 
    for nameCol in column:
        colInd = column[nameCol]
        worksheet.write(row, colInd, nameCol)

def writeExcelSensorDataValue(worksheet, currDataDownlaod):
    row = 1
    global column
    # NB: the rows should be ordered by date for a real effect 
    currDate = None 
    objDates = {}
    for currRowData in currDataDownlaod:
        # writing the first column date
        if(currDate == None): 
            currDate = currRowData['date']
            objDates[currDate] = row
            worksheet.write(row, column['date'], currDate)
        else:
            if(currDate != currRowData['date']):
                currDate = currRowData['date']
                row = row + 1
                objDates[currDate] = row
                worksheet.write(row, column['date'], currDate)
        # writing the current substance following the index column
        currProperty = currRowData['substance'] + "_" + currRowData['sensor']
        currColIndex = column[currProperty]
        currValue = currRowData['value']
        
        worksheet.write(row, currColIndex, currValue)
        # writing the currnet session 
        sessionColIndex = column['session']
        currSessionName = currRowData['session']
        worksheet.write(row, sessionColIndex, currSessionName)

        
        
       

        
