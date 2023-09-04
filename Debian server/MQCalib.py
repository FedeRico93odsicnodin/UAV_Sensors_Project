#
# logic for the MQ sensors calibration based on parameters coming from 
# SCD sensor. 
# Hence temperature and RH will be used for obtaining resistance ratio 
# then a formula with points interpolation is applied for calculating current 
# ppm concetration starting from new already points known on curve 
# Those points should be configurable.
# obtained values are not completely precise, but in relative context will work well too.
#
# reading calibration data from the calib file in the ref docs folder
import csv
# classes for the calibration process 
class RLVal():
    def __init__(self):
        self.temperature = 0
        self.RLVal = 0
class CalibRL():
    def __init__(self):
        self.humidity = ''
        self.RLVals = []
class CalcPPM():
    def __init__(self):
        self.PPM1 = 0
        self.PPM2 = 0
        self.RL1 = 0
        self.RL2 = 0

# row of all the headers reference 
rowHeader = {}
# calibration object 
calibObj = {}
def loadCalib(refCalibFilePath):
    global calibObj
    with open(refCalibFilePath, 'r') as f:
        csvCalib = csv.reader(f)
        readCalibFileHeader(csvCalib)
        readCalibrationValues(csvCalib)
        print(calibObj)

def readCalibFileHeader(csvCalibData):
    global rowHeader
    for rowCalib in csvCalibData:
        idxHeader = 0
        for colHeader in rowCalib:
            rowHeader[colHeader] = idxHeader
            idxHeader = idxHeader + 1
        break

def readCalibrationValues(csvCalibData):
    global calibObj
    global rowHeader
    rowIdx = 0
    # STEP1: adding the single properties for each sensor 
    preprocessData = {}
    preprocessDataRH33 = {}
    preprocessDataRH85 = {}
    for rowCalib in csvCalibData:
        #print(rowCalib)
        MQSensName = rowCalib[rowHeader['MQSensor']]
        MQPropName = rowCalib[rowHeader['PropName']]
        currValue = rowCalib[rowHeader['PropValue']]
        currTemperature = rowCalib[rowHeader['T']]
        currHumidity = 0
        if(rowCalib[rowHeader['RH']] != ''):
            currHumidity = int(rowCalib[rowHeader['RH']])
        currPropSensor = MQSensName + "_" + MQPropName
        if(MQPropName == 'RL' and currHumidity == 33):
            if((MQSensName in preprocessDataRH33) == False):
                preprocessDataRH33[MQSensName] = []
            preprocessDataRH33[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue

        if(MQPropName == 'RL' and currHumidity == 85):
            if((MQSensName in preprocessDataRH85) == False):
                preprocessDataRH85[MQSensName] = []
            preprocessDataRH85[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue
        # starting creation of the current sensor calib obj
        calibObj[rowCalib[rowHeader['MQSensor']]] = {}
        preprocessData[currPropSensor] = {'PropValue': currValue, 'T': currTemperature, 'RH': currHumidity }
        #if(currHumidity != ''):
        #    preprocessDataRH[currPropSensor + "_" + currHumidity] = {'PropValue': currValue, 'T': currTemperature }
    # STEP2: iterating the pre created calib obj (key = MQ Sensor)
    #print(preprocessData)
    print(preprocessDataRH85)
    for sensName in calibObj:
        # creation of the calc obj
        calcObj = createCalculationObj(sensName, preprocessData)
        calibObj[sensName]['calc'] = calcObj
        # creation of the RLVal obj
        calibObj[sensName]['RH33'] = createRHObj(sensName, preprocessDataRH33)
        calibObj[sensName]['RH85'] = createRHObj(sensName, preprocessDataRH85)



# creation of the calculus object 
def createCalculationObj(sensorName, preprocessData):
    ppm1Prop = sensorName + "_PPM1"
    ppm2Prop = sensorName + "_PPM2"
    RL1Prop = sensorName + "_RL1"
    RL2Prop = sensorName + "_RL2"
    if((ppm1Prop in preprocessData) 
       and (ppm2Prop in preprocessData)
       and (RL1Prop in preprocessData)
       and (RL2Prop in preprocessData)):
        currCalcObj = CalcPPM()
        currCalcObj.PPM1 = float(preprocessData[ppm1Prop]['PropValue'])
        currCalcObj.PPM2 = float(preprocessData[ppm2Prop]['PropValue'])
        currCalcObj.RL1 = float(preprocessData[RL1Prop]['PropValue'])
        currCalcObj.RL2 = float(preprocessData[RL2Prop]['PropValue'])
        return currCalcObj
    else: 
        return None
    
# creation of the RH specific obj
def createRHObj(sensorName, preprocessDataRH):
    currRHObj = []
    for currObj in preprocessDataRH[sensorName]:
        currRLObj = RLVal()
        currRLObj.temperature = int(currObj['T'])
        currRLObj.RLVal = float(currObj['val'])
        currRHObj.append(currRHObj)
    return currRHObj
