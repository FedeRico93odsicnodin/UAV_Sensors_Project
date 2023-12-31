
// analog sensors pins
const int MQ4_Pin=0; // MQ-4 analog pin
const int MQ7_Pin=1; // MQ-7 analog pin
const int MQ5_Pin=2; // MQ-5 analog pin 
const int MQ3_Pin=3; // MQ-3 analog pin
const int MQ135_Pin=4; // MQ-135 analog pin
const int MQ2_Pin=5; // MQ-2 analog pin

															
													  

// sensors outputs 
float MQ4_Out;
float MQ7_Out; // MQ-7 analog output 
float MQ5_Out; // MQ-5 analog output 
float MQ3_Out; // MQ-3 analog output 
float MQ135_Out; // MQ-135 analog output 
float MQ2_Out; // MQ-2 analog output 
const char compile_date[] = __DATE__ " " __TIME__;

						  
																   
																	
																	   
																			   
				 
 

// set up
void setup() {
  Serial.println(compile_date);
  // initialization of the serial monitor using bound rate of 115200
  Serial.begin(19200);
}

// main LOOP
void loop() {
  // read the analog sensors intensity from the different pins
  MQ4_Out = analogRead(MQ4_Pin);
  MQ7_Out = analogRead(MQ7_Pin);
  MQ5_Out = analogRead(MQ5_Pin);
  MQ3_Out = analogRead(MQ3_Pin);
  MQ135_Out = analogRead(MQ135_Pin);
  MQ2_Out = analogRead(MQ2_Pin); 
  String currLine = "Ms|";
  currLine += String(millis());
  currLine += "|0|CH4_MQ4_Description for MQ4|";
  currLine += MQ4_Out;
  currLine += "|1|CO_MQ7_Description for MQ7|";
  currLine += MQ7_Out;
  currLine += "|2|Gen_MQ5_Description for MQ5|";
  currLine += MQ5_Out;
  currLine += "|3|Alcohol_MQ3_Description for MQ3|";
  currLine += MQ3_Out;
  currLine += "|4|NH3_MQ135_Description for MQ135|";
  currLine += MQ135_Out;
  currLine += "|5|Comb_MQ2_Description for MQ2|";
  currLine += MQ2_Out;
  currLine += "|\n";
  Serial.print(currLine);

  delay(100);

}
