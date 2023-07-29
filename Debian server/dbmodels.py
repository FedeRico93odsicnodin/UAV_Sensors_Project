#
# Module which specify the objects models used with 
# database definitions 
#

import datetime 

class CompoundObj:
     def __init__(self):
          self.id = 0
          self.name = ''

class SensorObj:
     def __init__(self):
          self.id = 0
          self.name = ''
          self.descrition = ''
          self.gas_detection_ref = 0