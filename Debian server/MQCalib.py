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
import math 
# classes for the calibration process 
class RLVal():
    def __init__(self):
        self.temperature = 0
        self.RLVal = 0
    
class CalibRL():
    def __init__(self):
        self.humidity = 0
        self.RLVals = []
    def getNearestValue(self, currT):
        finalValue = None
        nearestMin = None
        nearestMax = None
        for v in self.RLVals:
            print(v.temperature)
            print(v.RLVal)
            if(v.temperature == currT):
                finalValue = v
                break
            if v.temperature < currT:
                if(nearestMin == None): nearestMin = v 
                else: 
                    if(nearestMin.temperature < v.temperature):
                        nearestMin = v 
                continue
            if(v.temperature > currT):
                if(nearestMax == None): nearestMax = v
                else:
                    if(nearestMax.temperature > v.temperature):
                        nearestMax = v
                continue
        # obtaining the real value for the current RL at given RH and temperature
        if(finalValue != None): return finalValue
        # approximation of the returned value at the temperature point 
        finalValue = RLVal()
        finalValue.temperature = currT
        if(nearestMax != None and nearestMin != None):
            finalValue.RLVal = (nearestMax.RLVal + nearestMin.RLVal) / 2
            return finalValue
        # TODO: eventually handling approximations for the different temperatures and extremes
        if(nearestMin != None):
            finalValue.RLVal = nearestMin.RLVal
            return finalValue
        if(nearestMax != None):
            finalValue.RLVal = nearestMax.RLVal


class CalcPPM():
    def __init__(self):
        self.PPM1 = 0
        self.PPM2 = 0
        self.RL1 = 0
        self.RL2 = 0
        # additional points for the final calculus PPM
        self.logPPM1 = 0
        self.logRL1 = 0
    def getCurveCoeff(self):
        pointPPM1 = self.PPM1
        pointPPM2 = self.PPM2
        pointRL1 = self.RL1
        pointRL2 = self.RL2
        # following the curve definition
        if(self.PPM1 > self.PPM2):
            pointPPM1 = self.PPM2
            pointPPM2 = self.PPM1
            pointRL1 = self.RL2
            pointRL2 = self.RL1
        # calculating the logaritmic values 
        self.logPPM1 = math.log(pointPPM1)
        self.logRL1 = math.log(pointRL1)
        logPPM2 = math.log(pointPPM2)
        logRL2 = math.log(pointRL2)
        diffRL = logRL2 - self.logRL1
        diffPPM = logPPM2 - self.logPPM1
        finalCoeff = diffRL / diffPPM
        return finalCoeff
# row of all the headers reference 
rowHeader = {}
# calibration object 
calibObj = {}
# converting kelvin temperature
def getKTemperature(currT):
    currK = currT + 273.15
    return currK
# proportionating the value for the obtained RL(T) wrt RH 
def proportionateRLOnRH(currRH, refRH, RLK):
    product1 = RLK * currRH
    propRL = product1 / refRH
    return propRL
def loadCalib(refCalibFilePath):
    global calibObj
    with open(refCalibFilePath, 'r') as f:
        csvCalib = csv.reader(f)
        readCalibFileHeader(csvCalib)
        readCalibrationValues(csvCalib)
        # TODO: eventual test 
        currVal = calibObj['MQ4']['RH0_hyp']
        print(currVal)
        
        #print(currVal.RLVal)
        #print(currVal.temperature)
# creation of the initial header dictionary for the MQ Calib file 
def readCalibFileHeader(csvCalibData):
    global rowHeader
    for rowCalib in csvCalibData:
        idxHeader = 0
        for colHeader in rowCalib:
            rowHeader[colHeader] = idxHeader
            idxHeader = idxHeader + 1
        break


# creation of all the objects used for the calibration 
def readCalibrationValues(csvCalibData):
    global calibObj
    global rowHeader
    rowIdx = 0
    # STEP1: adding the single properties for each sensor 
    preprocessData = {}
    preprocessDataRH33 = {}
    preprocessDataRH85 = {}
    # this obj used only by MQ2 
    preprocessDataRH60 = {}
    # this objects for hypothetical values at extremes of pressure
    preprocessDataRH0_hyp = {}
    preprocessDataRH137_hyp = {}
    # preprocess data for hypothetical values 
    for rowCalib in csvCalibData:
        MQSensName = rowCalib[rowHeader['MQSensor']]
        MQPropName = rowCalib[rowHeader['PropName']]
        currValue = rowCalib[rowHeader['PropValue']]
        currTemperature = rowCalib[rowHeader['T']]
        currHumidity = 0
        if(rowCalib[rowHeader['RH']] != ''):
            currHumidity = int(rowCalib[rowHeader['RH']])
        currPropSensor = MQSensName + "_" + MQPropName
        # populating pre process data for RH = 33 (common to all sensors)
        if(MQPropName == 'RL' and currHumidity == 33):
            if((MQSensName in preprocessDataRH33) == False):
                preprocessDataRH33[MQSensName] = []
            preprocessDataRH33[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue
        # populating pre process data for RH = 85 (common to all sensors)
        if(MQPropName == 'RL' and currHumidity == 85):
            if((MQSensName in preprocessDataRH85) == False):
                preprocessDataRH85[MQSensName] = []
            preprocessDataRH85[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue
        # populating pre process data for RH = 60 (only for MQ 2)
        if(MQPropName == 'RL' and currHumidity == 60):
            if((MQSensName in preprocessDataRH60) == False):
                preprocessDataRH60[MQSensName] = []
            preprocessDataRH60[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue
        if(MQPropName == 'RL_hyp' and currHumidity == 0):
            if((MQSensName in preprocessDataRH0_hyp) == False):
                preprocessDataRH0_hyp[MQSensName] = []
            preprocessDataRH0_hyp[MQSensName].append({'T': currTemperature, 'val': currValue})
            continue
        if(MQPropName == 'RL_hyp' and currHumidity == 137):
            if((MQSensName in preprocessDataRH137_hyp) == False):
                preprocessDataRH137_hyp[MQSensName] = []
            preprocessDataRH137_hyp[MQSensName].append({'T': currTemperature, 'val': currValue})
        # starting creation of the current sensor calib obj
        calibObj[rowCalib[rowHeader['MQSensor']]] = {}
        preprocessData[currPropSensor] = {'PropValue': currValue, 'T': currTemperature, 'RH': currHumidity }
        #if(currHumidity != ''):
        #    preprocessDataRH[currPropSensor + "_" + currHumidity] = {'PropValue': currValue, 'T': currTemperature }
    # STEP2: iterating the pre created calib obj (key = MQ Sensor)
    for sensName in calibObj:
        # creation of the calc obj
        calcObj = createCalculationObj(sensName, preprocessData)
        calibObj[sensName]['calc'] = calcObj
        # creation of the RLVal obj
        calibObj[sensName]['RH33'] = createRHObj(sensName, preprocessDataRH33, 33)
        calibObj[sensName]['RH85'] = createRHObj(sensName, preprocessDataRH85, 85)
        # creation of the RH 60 values for the sensor if they exist
        if(sensName in preprocessDataRH60):
            print('creating obj 60 for sensor ' + sensName)
            calibObj[sensName]['RH60'] = createRHObj(sensName, preprocessDataRH60, 60)
        # creation of the hypothetical values in case of extremes
        calibObj[sensName]['RH0_hyp'] = createRHObj(sensName, preprocessDataRH0_hyp, 0)
        calibObj[sensName]['RH137_hyp'] = createRHObj(sensName, preprocessDataRH137_hyp, 137)

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
def createRHObj(sensorName, preprocessDataRH, RHVal):
    currRHObj = []
    for currObj in preprocessDataRH[sensorName]:
        currRLObj = RLVal()
        currRLObj.temperature = getKTemperature(float(currObj['T']))
        currRLObj.RLVal = float(currObj['val'])
        currRHObj.append(currRLObj)
    finalObjRH = CalibRL()
    finalObjRH.humidity = RHVal
    finalObjRH.RLVals = currRHObj
    return finalObjRH
# obtaining corresponding ppm value for the voltage intensity read 
def getPPMValue(intensity, sensorName, temperature, humidity):
    print("to be implemented")
# obtaining the current approximated value for RL
def getCurrRLVal(sensor, T, RH):
    global calibObj
    # initial conversion Kelvin
    TK = getKTemperature(T)
    # getting the value for RH33 + proportion on humidity
    valRH33 = calibObj[sensor]['RH33'].getNearestValue(TK)
    RL33 = proportionateRLOnRH(RH, 33, valRH33.RLVal)
    # getting the value for RH85 + proportion on humidity 
    valRH85 = calibObj[sensor]['RH85'].getNearestValue(TK)
    RL85 = proportionateRLOnRH(RH, 85, valRH85.RLVal)
    # standard case: having a range for the RH value 
    if(RH >= 33 and RH <= 85):
        # median on the obtained RH values 
        RLApprox = (RL33 + RL85) / 2
        return RLApprox
    # TODO: completing for the hypothesis on RH values and MQ2 real values too

