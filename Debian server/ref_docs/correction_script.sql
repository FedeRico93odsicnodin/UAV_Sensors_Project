-- this script is for selecting the resistor values 
-- and for eventually make a correction on them inspecting the calib calculus file 
select * from rzero_resistors
join sensors on sensor_ref = sensors.id 

-- previous value of MQ4 = 224.780926082092
update rzero_resistors set rzero_value = 716.415329001508
where id = 1
