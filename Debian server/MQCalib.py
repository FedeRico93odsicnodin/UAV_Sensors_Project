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
# helper class for obtaining the value of current RL dependant on environment RH and temperature
class CalibRL():
    def __init__(self):
        self.humidity = 0
        self.RLVals = []
    def getNearestValue(self, currT):
        finalValue = None
        nearestMin = None
        nearestMax = None
        for v in self.RLVals:
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
            return finalValue
# obj for the selected points of PPM1, PPM2, RL1 and RL2 on curve 
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
        self.logPPM1 = math.log10(pointPPM1)
        self.logRL1 = math.log10(pointRL1)
        logPPM2 = math.log10(pointPPM2)
        logRL2 = math.log10(pointRL2)
        diffRL = logRL2 - self.logRL1
        diffPPM = logPPM2 - self.logPPM1
        finalCoeff = diffRL / diffPPM
        return finalCoeff
# row of all the headers reference 
rowHeader = {}
# calibration object 
calibObj = {}
# list of sensors which have RH60 curve values 
RH60_sensors = ['MQ2']
# all values of R0s for the sensors (retrieved or calibrated realtime)
R0_values = {}
# staring params before SCD sensor startup 
Calib_start_params = {}
# debugging the current lines of calculus in console 
debug_calculation = True
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
    global Calib_start_params
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
        # starting values for the current calibration 
        if(rowCalib[rowHeader['PropName']] == 'Start'):
            Calib_start_params['TVal'] = float(rowCalib[rowHeader['T']])
            Calib_start_params['RHVal'] = float(rowCalib[rowHeader['RH']])
            continue
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
            calibObj[sensName]['RH60'] = createRHObj(sensName, preprocessDataRH60, 60)
            print(sensName)
            print(calibObj[sensName]['RH60'])
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
    global calibObj
    # getting the current value for the RL resistor depending on RH and T(K) factors
    currRL = getCurrRLVal(sensorName, temperature, humidity)
    # retrieving the values on curve 
    curvCoeff = calibObj[sensorName]['calc'].getCurveCoeff()
    ppm1Log = calibObj[sensorName]['calc'].logPPM1
    RL1Log = calibObj[sensorName]['calc'].logRL1
    # getting the value of RS from intensity 
    RS = getCurrentRSFromIntensity(intensity)
    # getting the current value for R0 (using experimental RL) 
    currR0 = RS / currRL
    # in case first value this is the used value for the calculus
    firstR0 = False
    if((sensorName in R0_values) == False):
        R0_values[sensorName] = currR0
        firstR0 = True
    # calculation of used values for 
    usedR0 = R0_values[sensorName]
    usedRL = RS / usedR0
    logRL = math.log10(usedRL)
    # calculation of first term 
    eqFirstTerm = (1 / curvCoeff) * (logRL - RL1Log)
    # calculation second term : coeff just not present
    eqSecondTerm =  - 1 * ppm1Log
    # logarithm for the PPM concentration: NB sign
    logPPMx = eqFirstTerm - eqSecondTerm
    PPMx = pow(10, logPPMx)
    # updating the R0 value mediating the collected one 
    if(firstR0 == False):
        R0_values[sensorName] = (R0_values[sensorName] + currR0) / 2
    # printing all the values for calculation 
    '''if(debug_calculation):
        print(
            "sensor: " + sensorName
            + ", intensity: " + str(intensity) 
            + ", temperature: " + str(temperature)
            + ", humidity: " + str(humidity)
            + ", curvCoeff: " + str(curvCoeff)  
            + ", ppm1Log: " + str(ppm1Log) 
            + ", RL1Log: " + str(RL1Log) 
            + ", RS: " + str(RS)
            + ", currRL: " + str(currRL)
            + ", currR0: " + str(currR0)
            + ", usedR0: " + str(usedR0)
            + ", UsedRL: " + str(usedRL)
            + ", PPMx: " + str(PPMx))'''
    '''if(sensorName == 'MQ4'):
        print(
            "RL: " + str(usedRL) 
            + " RLLog: " + str(logRL) 
            + " RL1Log: " + str(RL1Log) 
            + " ppm1Log: " + str(ppm1Log) 
            + " coeff: " + str(curvCoeff)
            + " term1: " + str(eqFirstTerm) 
            + " term2: " + str(eqSecondTerm) 
            + " logppmX: " + str(logPPMx) 
            + " PPMx: " + str(PPMx))'''
    print(
            "RL: " + str(usedRL) 
            + " RLLog: " + str(logRL) 
            + " RL1Log: " + str(RL1Log) 
            + " ppm1Log: " + str(ppm1Log) 
            + " coeff: " + str(curvCoeff)
            + " term1: " + str(eqFirstTerm) 
            + " term2: " + str(eqSecondTerm) 
            + " logppmX: " + str(logPPMx) 
            + " PPMx: " + str(PPMx))
    
    return PPMx
# getting the corresponding voltage for the current read
def getCurrentRSFromIntensity(intensity):
    v_0 = (float(intensity) * 5) / 1023
    RS = (5 - v_0) * 1000 / v_0
    return RS
# obtaining the current approximated value for RL
def getCurrRLVal(sensor, T, RH):
    global calibObj
    global RH60_sensors
    # initial conversion Kelvin
    TK = getKTemperature(T)
    # getting the value for RH33 + proportion on humidity
    valRH33 = calibObj[sensor]['RH33'].getNearestValue(TK)
    RL33 = proportionateRLOnRH(RH, 33, valRH33.RLVal)
    # getting the value for RH85 + proportion on humidity 
    valRH85 = calibObj[sensor]['RH85'].getNearestValue(TK)
    RL85 = proportionateRLOnRH(RH, 85, valRH85.RLVal)
    # getting the value for RH60 (for the moment MQ4 only)
    RL60 = None 
    if(sensor in RH60_sensors):
        valRH60 = calibObj[sensor]['RH60'].getNearestValue(TK)
        RL60 = proportionateRLOnRH(RH, 60, valRH60.RLVal)
    # getting the value for the hypothesis 
    valRH0Hyp = calibObj[sensor]['RH0_hyp'].getNearestValue(TK)
    # for the 0 approximation using RH = 1
    RL0Hyp = proportionateRLOnRH(RH, 1, valRH0Hyp.RLVal)
    valRH137Hyp = calibObj[sensor]['RH137_hyp'].getNearestValue(TK)
    RL137Hyp = proportionateRLOnRH(RH, 137, valRH0Hyp.RLVal)
    # standard case: having a range for the RH value 
    if(sensor in RH60_sensors):
        if(RH >= 33 and RH <= 60 and RL60 != None):
            RLApprox = (RL33 + RL60) / 2
            return RLApprox
        if(RH > 60 and RH <= 85 and RL60 != None):
            RLApprox = (RL60 + RL85) / 2
            return RLApprox
    if(RH >= 33 and RH <= 85):
        # median on the obtained RH values 
        RLApprox = (RL33 + RL85) / 2
        return RLApprox
    if(RH > 85):
        RLApprox = (RL85 + RL137Hyp) / 2
        return RLApprox
    if(RH < 33):
        RLApprox = (RL33 + RL0Hyp) / 2
        return RLApprox
    

