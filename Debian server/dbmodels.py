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
          self.color = ''
     def gasObj(self):
          return {'id': self.id, 'name': self.name, 'color': self.color }

class SensorObj:
     def __init__(self):
          self.id = 0
          self.name = ''
          self.descrition = ''
          self.gas_detection_ref = 0
          self.minVal = 0
          self.maxVal = 0
          self.avgVal = 0
     def sensorObj(self):
          return {
               "id":self.id, 
               "name": self.name, 
               "description": self.descrition, 
               "ref_gas": self.gas_detection_ref,
               "minVal": self.minVal,
               "maxVal": self.maxVal,
               "avgVal": self.avgVal
               }

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

class RZeroResistance:
     def __init__(self):
          self.id = 0
          self.sensor_ref = 0
          self.sensor_name = ''
          self.resValue = 0

# object with all the returned information for the current visualized graphs 
class DashboardCurrVisualzed:
     def __init__(self):
          self.id = 0
          self.session_ref = 0
          self.gas_ref = 0
          # by default the visualization is on ALL the set (-1) 
          self.vis_type = -1
          # by default the granularity is of mmm
          self.vis_granularity = "mmm"
          # all the set exposed for the visualization
          self.is_visualized = 0 
          self.visualized_set = []
     def dashboardCurrVisualized(self):
          return {
               "id": self.id, 
               "session_ref": self.session_ref, 
               "gas_ref": self.gas_ref, 
               "vis_type": self.vis_type, 
               "vis_granularity": self.vis_granularity, 
               "visualized_set": self.visualized_set
               }

