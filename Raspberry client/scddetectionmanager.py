#
# a module for the custom SCD sensor i2c detection 
# if sensor is not detected from config a simulation is started 
#

# standard modules
import time 
from datetime import datetime
# sensors modules 
from sensirion_i2c_driver import LinuxI2cTransceiver, I2cConnection
from sensirion_i2c_scd import Scd4xI2cDevice
# custom modules 
import simulators 

def scdSensorDetectionThread(sensorsObj):
    scd41 = None
    sensorContent = []
    if(sensorsObj.activeSCD):
        
            while(True):
                try:
                    with LinuxI2cTransceiver(sensorsObj.getI2CPortSCD()) as i2c_transceiver:
                        i2c_connection = I2cConnection(i2c_transceiver)
                        scd41 = Scd4xI2cDevice(i2c_connection)
                        scd41.start_periodic_measurement()
                        while(True):
                            try:
                                sensorContent = []
                                time.sleep(int(sensorsObj.scdMeasureTime))
                                co2, temperature, humidity = scd41.read_measurement()
                                sensorContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
                                sensorContent.append(str(co2.co2))
                                sensorContent.append(str(temperature.degrees_celsius))
                                sensorContent.append(str(temperature.ticks))
                                sensorContent.append(str(humidity.percent_rh))
                                sensorContent.append(str(humidity.ticks))
                                #print(sensorContent)
                                sensorsObj.sensorSCDQueue().put(sensorContent)
                            except:
                                sensorContent = []
                                time.sleep(int(sensorsObj.scdMeasureTime))
                                #co2, temperature, humidity = scd41.read_measurement()
                                sensorContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
                                sensorContent.append('0')
                                sensorContent.append('0')
                                sensorContent.append('0')
                                sensorContent.append('0')
                                sensorContent.append('0')
                                sensorsObj.sensorSCDQueue().put(sensorContent)
                except:
                    sensorContent = []
                    time.sleep(int(sensorsObj.scdMeasureTime))
                    sensorContent.append(datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3])
                    sensorContent.append('0')
                    sensorContent.append('0')
                    sensorContent.append('0')
                    sensorContent.append('0')
                    sensorContent.append('0')
                    sensorsObj.sensorSCDQueue().put(sensorContent)
    else:
        while(True):
            time.sleep(int(sensorsObj.scdMeasureTime))
            sensorContent = simulators.getSimulatedSCDContent()
            sensorsObj.sensorSCDQueue().put(sensorContent)
            
