#
# Module which specify the objects models used with 
# database definitions 
#

import datetime 
import json

class CompoundObj:
     def __init__(self):
          self.id = 0
          self.name = ''
     def gasObj(self):
          return {'id': self.id, 'name': self.name }

class SensorObj:
     def __init__(self):
          self.id = 0
          self.name = ''
          self.descrition = ''
          self.gas_detection_ref = 0
     def sensorObj(self):
          return {"id":self.id, "name": self.name, "description": self.descrition, "ref_gas": self.gas_detection_ref}

class SessionObj:
     def __init__(self):
          self.id = 0
          self.name = ''
          self.begin_date = datetime.datetime(1,1,1,0,0)
          self.end_date = datetime.datetime(1,1,1,0,0)
     def sessionObj(self):
          return {"id": self.id, "name": self.name, "begin_date": str(self.begin_date), "end_date": str(self.end_date)}

class FilterObj:
     def __init__(self):
          self.id = 0
          self.selected = 0
          self.filter_context = ''
          self.filter_name = ''
          self.filter_value = ''
     def filterObj(self):
          return {"id": self.id, "selected": self.selected, "filter_context": self.filter_context, "filter_name": self.filter_name, "filter_value": self.filter_value}

class SensorDataObj:
     def __init__(self):
          self.id = 0
          self.date = datetime.datetime(1,1,1,0,0)
          self.detected_substance_id = 0
          self.detected_substance_val = 0
          self.sensor_id = 0
          self.session_ref = 0

