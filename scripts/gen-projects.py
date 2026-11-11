#!/usr/bin/env python3
"""Generate site/data/projects.json: curated projects (minus critical power electronics) plus a
generated wireless/embedded catalogue (application x connectivity/feature). Each project links to an
IEEE Xplore search for its topic; no individual paper is claimed."""
import json, re, os
from urllib.parse import quote
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'site', 'data', 'projects.json')

# ---- application library: name | class | sensors | outputs | what it does | IEEE keywords
APPS = '''
Smart Irrigation Controller|field|Soil moisture sensor;DHT22;Rain sensor|Relay + water pump|irrigates only when the soil is dry and no rain is detected|smart irrigation soil moisture
Greenhouse Climate Monitor|field|DHT22;BH1750 light sensor;MH-Z19B CO2 sensor|Fan relay;Grow-light relay|keeps temperature, humidity, light and CO2 inside the crop's target range|greenhouse monitoring control
Crop Disease Early-Warning Station|field|DHT22;Leaf-wetness sensor;BH1750 light sensor|Buzzer;OLED display|warns the farmer when humidity and leaf wetness favour fungal disease|crop disease prediction sensor
Smart Poultry Farm Monitor|field|DHT22;MQ-135 ammonia sensor;Water level sensor|Exhaust fan relay;Buzzer|tracks heat, ammonia and water so the shed stays safe for the birds|poultry farm monitoring
Fish Pond Water Quality Monitor|field|pH sensor;TDS sensor;DS18B20 probe;Turbidity sensor|Aerator relay;Buzzer|logs water quality and switches the aerator when oxygen demand rises|aquaculture water quality
Aquaponics Controller|field|pH sensor;Water level sensor;DS18B20 probe|Pump relay;Buzzer|balances water level, pH and temperature in a fish-and-plant loop|aquaponics automation
Flood Early-Warning System|field|JSN-SR04T waterproof ultrasonic;Rain sensor|Siren;OLED display|measures water rise and raises a warning before the level becomes dangerous|flood early warning
River Water Level Monitor|field|JSN-SR04T waterproof ultrasonic;DS18B20 probe|OLED display|reports river level and rate of rise to a remote dashboard|water level monitoring telemetry
Landslide Early-Warning Node|field|MPU6050;Soil moisture sensor;Rain sensor|Siren;Buzzer|detects ground tilt and soil saturation that come before a slope failure|landslide detection sensor
Forest Fire Detection Node|field|Flame sensor;MQ-2 smoke sensor;DHT22|Siren;Buzzer|detects flame, smoke and heat and alerts rangers early|forest fire detection wireless sensor
Weather Station|field|BME280;Anemometer;Rain gauge;UV sensor|OLED display|measures temperature, pressure, wind, rain and UV and publishes them online|weather station IoT
Air Quality Monitoring Station|field|PMS5003 dust sensor;MQ-135;BME280|OLED display;Buzzer|reports PM2.5, gases and comfort data with an air-quality index|air quality monitoring IoT
Noise Pollution Monitor|field|INMP441 microphone;BME280|OLED display;Buzzer|logs sound levels in decibels and flags zones that exceed the limit|noise pollution monitoring
Smart Street Light Controller|field|LDR;PIR sensor;SCT-013 current sensor|LED lamp driver module|dims and brightens lights by daylight and movement, and reports faulty lamps|smart street lighting
Smart Parking Slot Detector|field|HC-SR04 ultrasonic;IR sensor|LED indicators;OLED display|shows free and occupied slots so drivers find parking quickly|smart parking system
Smart Dustbin Fill-Level Monitor|field|HC-SR04 ultrasonic;HX711 load cell|Servo lid;Buzzer|reports how full each bin is so collection is planned by need|smart waste management
Waste Collection Route Monitor|field|HC-SR04 ultrasonic;NEO-6M GPS|OLED display|links bin fill levels with truck position to optimise routes|waste collection route optimization
Water Tank Level Controller|field|JSN-SR04T waterproof ultrasonic;Float switch|Pump relay;Buzzer|keeps the overhead tank filled and stops dry-run and overflow|water tank level control
Water Leak and Flow Monitor|field|YF-S201 flow sensor;Pressure sensor|Solenoid valve;Buzzer|spots leaks from abnormal flow and shuts the valve|water leakage detection
Smart Water Meter|field|YF-S201 flow sensor|OLED display;Relay|measures consumption and sends readings for remote billing|smart water meter
Pump Dry-Run Protection and Monitor|field|SCT-013 current sensor;Flow sensor|Pump relay;Buzzer|stops the pump when current or flow shows it is running dry|pump monitoring protection
Solar Panel Performance Monitor|field|INA219;LDR;DS18B20 probe|OLED display|measures voltage, current and temperature to catch dust and panel faults|solar PV monitoring IoT
Energy Meter with Remote Billing|field|PZEM-004T energy meter|Relay;OLED display|reads energy usage and lets the owner see bills and cut supply remotely|smart energy meter IoT
Soil Nutrient Monitor|field|RS485 NPK sensor;Soil moisture sensor|OLED display|measures nitrogen, phosphorus and potassium to guide fertiliser use|soil nutrient NPK sensing
Beehive Health Monitor|field|DHT22;HX711 load cell;INMP441 microphone|OLED display|tracks hive weight, climate and sound to spot swarming and disease early|beehive monitoring
Cold Chain Temperature Logger|field|DS18B20 probe;DHT22|Buzzer;OLED display|logs temperature through transport and alerts on any breach|cold chain monitoring
Grain Storage Monitor|field|DHT22;MQ-135|Ventilation fan relay;Buzzer|watches humidity and gas to prevent spoilage in storage|grain storage monitoring
Mushroom Cultivation Controller|field|DHT22;Soil moisture sensor|Humidifier relay;Fan relay|holds humidity and temperature at the levels mushrooms need|mushroom cultivation automation
Farm Animal Intrusion Repellent|field|PIR sensor;HC-SR04 ultrasonic|Siren;Strobe light|detects animals at the field edge and scares them away|animal intrusion detection farm
Wild Animal Intrusion Alert|field|PIR sensor;Vibration sensor|Siren;Buzzer|warns villages when large animals approach|wild animal detection alert system
Road Condition Logger|field|MPU6050;NEO-6M GPS|OLED display|maps potholes and rough patches from vehicle vibration|road surface condition monitoring
Bridge Vibration Health Monitor|field|ADXL345;DS18B20 probe|OLED display|tracks vibration and temperature to flag structural changes|structural health monitoring
Pipeline Leak Detector|field|Pressure sensor;YF-S201 flow sensor|Solenoid valve;Buzzer|detects pressure drops that signal a leak along a pipeline|pipeline leak detection
Earthquake Early Detector|field|ADXL345;MPU6050|Siren;OLED display|detects ground shaking and sounds an alarm in seconds|earthquake detection accelerometer
Rainfall and Runoff Telemetry|field|Rain gauge;JSN-SR04T waterproof ultrasonic|OLED display|reports rainfall and channel level for local flood management|rainfall monitoring telemetry
Smart Home Automation|home|4-channel relay inputs;PIR sensor;DHT22|Relay board;Buzzer|controls lights and appliances from a phone and by schedule|home automation IoT
Home Energy Monitor|home|PZEM-004T energy meter|Relay;OLED display|shows live power and daily usage of the household|home energy monitoring
Smart Door Lock with Keypad and RFID|home|RC522 RFID reader;4x4 keypad|Solenoid lock;Buzzer|opens the door only for a valid card and code, and logs every entry|smart door lock RFID
Fingerprint Door Access|home|R307 fingerprint sensor|Solenoid lock;OLED display|unlocks by fingerprint and records who entered and when|fingerprint door access
Gas Leakage Detector and Auto Shut-off|home|MQ-6 gas sensor;DHT22|Servo valve;Exhaust fan relay;Buzzer|detects LPG leaks, sounds an alarm and closes the supply|gas leakage detection LPG
Fire and Smoke Alarm|home|MQ-2 smoke sensor;Flame sensor;DHT22|Buzzer;Relay|detects smoke and flame and alerts the household at once|fire alarm smoke detection
Smart Medicine Reminder Box|home|DS3231 RTC;IR sensor|Servo lid;Buzzer;OLED display|reminds the patient at dose time and tells family if a dose is missed|medicine reminder IoT
Indoor Air Quality Monitor|home|CCS811;SGP30;DHT22|OLED display;Buzzer|reports CO2, VOC and comfort so the room can be ventilated in time|indoor air quality monitoring
Baby Cradle Monitor|home|INMP441 microphone;DHT22|Servo cradle;Buzzer|swings the cradle when the baby cries and reports the room climate|baby monitoring cradle
Smart Aquarium Controller|home|DS18B20 probe;Water level sensor;pH sensor|Feeder servo;LED light relay|automates feeding, lighting and water-condition alerts|smart aquarium automation
Smart Pet Feeder|home|HX711 load cell;DS3231 RTC|Feeder servo;OLED display|dispenses measured portions on schedule and logs meals|smart pet feeder
Smart Plant Pot|home|Soil moisture sensor;LDR;DHT22|Water pump;Grow LED|waters and lights a houseplant as it needs and reports its health|smart plant monitoring
Hydroponic Nutrient Controller|home|TDS sensor;pH sensor;DS18B20 probe|Peristaltic pumps;Relay|keeps the nutrient solution at the right strength and acidity|hydroponics nutrient control
Classroom Attendance System|home|RC522 RFID reader;DS3231 RTC|OLED display;Buzzer|marks attendance on a card tap and uploads the register|RFID attendance system
Smart Library Book Tracker|home|RC522 RFID reader|OLED display;Buzzer|issues, returns and locates books by RFID tag|RFID library management
Energy-Saving Classroom Controller|home|PIR sensor;LDR;DHT22|Relay board|switches lights and fans off when a room is empty|occupancy based energy saving
Smart Switch Board|home|4-channel relay inputs|Relay board;OLED display|gives each switch app, schedule and manual control|smart switch IoT
Smart Curtain Controller|home|LDR;DS3231 RTC|28BYJ-48 stepper motor;ULN2003 driver|opens and closes curtains by sunlight and time|smart curtain automation
Hospital Bed Occupancy Monitor|home|HX711 load cell;IR sensor|Buzzer;OLED display|tells the nurse station when a bed is occupied or the patient leaves|hospital bed monitoring
Patient Call Button System|home|Push buttons|Buzzer;OLED display|shows which bed called so staff respond faster|nurse call system wireless
Touchless Sanitizer Dispenser|home|HC-SR04 ultrasonic;Level sensor|Mini pump;LED indicator|dispenses on hand detection and reports when the refill is low|touchless dispenser
Touchless Temperature Gate|home|MLX90614 IR thermometer;HC-SR04 ultrasonic|Servo gate;Buzzer|checks temperature at the door and allows entry only when normal|contactless temperature screening
Smart Mailbox|home|Reed switch;PIR sensor|Buzzer;LED indicator|tells the owner when mail or a parcel arrives|smart mailbox IoT
Smart Refrigerator Monitor|home|DHT22;MQ-135;Reed switch|Buzzer;OLED display|watches temperature, door and spoilage gases and warns of faults|smart refrigerator monitoring
Smart Washroom Hygiene Monitor|home|PIR sensor;MQ-135|Buzzer;LED indicator|tracks occupancy and odour to schedule cleaning|smart restroom monitoring
Fingerprint Attendance System|home|R307 fingerprint sensor;DS3231 RTC|OLED display;Buzzer|records attendance by fingerprint and uploads it to a sheet|biometric attendance IoT
Smart Locker System|home|4x4 keypad;RC522 RFID reader|Solenoid lock;Buzzer|opens a locker with a one-time code or card and logs access|smart locker IoT
Smart Retail Shelf|home|HX711 load cell|OLED display;LED indicator|tracks stock by weight and warns when items run low|smart shelf weight sensing
Token Queue Management System|home|Push buttons;IR sensor|7-segment display;Buzzer|issues tokens and shows the next number on a display|queue management system
Women Safety Wearable|wear|SOS button;MPU6050;NEO-6M GPS|Buzzer;Vibration motor|sends the live location to contacts when the SOS is pressed|women safety wearable
Elderly Fall Detection Band|wear|MPU6050;MAX30102 pulse sensor|Buzzer;Vibration motor|detects a fall and alerts family with the location|fall detection wearable
Smart Helmet Crash Alert|wear|MPU6050;NEO-6M GPS;IR helmet-worn sensor|Buzzer;Ignition-lock relay|detects a crash and shares the location, and checks the helmet is worn|smart helmet accident detection
Smart Health Band|wear|MAX30102 pulse sensor;MLX90614 IR thermometer|OLED display;Vibration motor|shows heart rate, SpO2 and temperature on the wrist|wearable health monitoring
Patient Vital Signs Monitor|wear|MAX30102 pulse sensor;AD8232 ECG;MLX90614 IR thermometer|OLED display;Buzzer|tracks heart rate, ECG and temperature and warns on abnormal values|patient monitoring system
ECG Monitoring Patch|wear|AD8232 ECG sensor|OLED display|streams a live ECG and flags irregular rhythm|ECG monitoring wearable
Smart Stick for the Visually Impaired|wear|HC-SR04 ultrasonic;Water sensor|Buzzer;Vibration motor|warns of obstacles and water ahead and shares the location|smart cane visually impaired
Child Safety Tracker|wear|NEO-6M GPS;SOS button|Buzzer|shows the child's location and alerts when they leave a safe zone|child tracking GPS
Pet Location Tracker|wear|NEO-6M GPS;MPU6050|Buzzer|tracks a pet's position and activity|pet tracking GPS
Vehicle Anti-Theft Tracker|wear|NEO-6M GPS;MPU6050|Ignition-lock relay;Buzzer|reports position and alerts on movement or tampering|vehicle anti-theft tracking
Vehicle Accident Detection and Alert|wear|MPU6050;Vibration sensor;NEO-6M GPS|Buzzer;OLED display|detects an impact and sends the crash location to responders|vehicle accident detection
Driver Drowsiness Alert|wear|IR eye-blink sensor;MPU6050|Buzzer;Vibration motor|detects long eye closure or head nod and wakes the driver|driver drowsiness detection
Alcohol Detection Ignition Lock|wear|MQ-3 alcohol sensor;NEO-6M GPS|Ignition relay;Buzzer|blocks the ignition when alcohol is detected and reports the event|alcohol detection vehicle
Sports Performance Tracker|wear|MPU6050;MAX30102 pulse sensor|OLED display|measures movement and heart rate during training|sports performance wearable
Posture Corrector Band|wear|MPU6050|Vibration motor;Buzzer|vibrates when the user slouches and logs posture time|posture monitoring wearable
Soldier Health and Location Tracker|wear|MAX30102 pulse sensor;MLX90614 IR thermometer;NEO-6M GPS|Buzzer;OLED display|reports vitals and position so help can be sent|soldier health monitoring tracking
Sign-to-Speech Smart Glove|wear|Flex sensors;MPU6050|DFPlayer Mini;Speaker|turns hand gestures into spoken words|sign language glove
School Bus Tracking System|wear|NEO-6M GPS;RC522 RFID reader|OLED display;Buzzer|shows bus position and logs students boarding and leaving|school bus tracking
Bus Passenger Counter|wear|IR break-beam sensors|OLED display|counts people boarding and leaving and shows seat availability|passenger counting system
Machine Vibration Predictive Maintenance Node|ind|ADXL345;DS18B20 probe|OLED display;Buzzer|learns normal vibration and warns before a bearing or belt fails|predictive maintenance vibration
Motor Health Monitor|ind|SCT-013 current sensor;DS18B20 probe;ADXL345|Buzzer;Relay|tracks motor current, heat and vibration to catch faults early|motor condition monitoring
Industrial Tank Level and Flow Telemetry|ind|JSN-SR04T waterproof ultrasonic;YF-S201 flow sensor|OLED display;Pump relay|reports tank level and flow and controls refill|industrial tank monitoring
Conveyor Object Counter|ind|IR sensor;HC-SR04 ultrasonic|OLED display;Buzzer|counts items on a conveyor and totals the shift's output|conveyor counting system
Industrial Gas Leak Monitor|ind|MQ-2;MQ-7 CO sensor|Siren;Exhaust fan relay|watches for combustible gas and carbon monoxide and sounds the alarm|industrial gas leak detection
Furnace Temperature Logger|ind|MAX6675 K-type thermocouple|OLED display;Buzzer|logs high temperatures and alerts on over-temperature|furnace temperature monitoring
Production Line Andon System|ind|Push buttons|Tower light;Buzzer|lets operators call help and shows line status on a board|andon production monitoring
Warehouse Climate Logger|ind|SHT31;DHT22|Buzzer;OLED display|records warehouse temperature and humidity and flags excursions|warehouse environment monitoring
Factory Energy Monitoring|ind|PZEM-004T energy meter;SCT-013 current sensor|OLED display|measures energy by machine to find waste|industrial energy monitoring
Transformer Temperature and Load Monitor|ind|DS18B20 probe;SCT-013 current sensor|Buzzer;OLED display|tracks oil temperature and load to prevent overheating|transformer monitoring IoT
Weighbridge Load Monitor|ind|HX711 load cell|OLED display|records vehicle load and prints a record for billing|weighing system load cell IoT
Crane Overload Alert|ind|HX711 load cell|Buzzer;Relay|warns and blocks lifting beyond the safe limit|crane overload protection
Process Pressure Monitor|ind|MPX5700 pressure sensor|OLED display;Buzzer|tracks line pressure and alerts on spikes or drops|pressure monitoring industrial
Elevator Condition Monitor|ind|MPU6050;DHT22|Buzzer;OLED display|logs ride quality and vibration to schedule service|elevator condition monitoring
Tool and Asset Tracker|ind|RC522 RFID reader|OLED display;Buzzer|tracks who has which tool and where assets are kept|RFID asset tracking
Smart Doorbell with Visitor Photo Alert|vision|ESP32-CAM OV2640;PIR sensor|Buzzer|takes a photo when someone arrives and sends it to the owner|smart doorbell camera
Vehicle Entry Logger with Plate Capture|vision|ESP32-CAM OV2640;HC-SR04 ultrasonic|Servo gate;OLED display|photographs each vehicle at the gate and logs it with time|vehicle plate recognition
Face Recognition Attendance|vision|ESP32-S3 camera|OLED display;Relay|recognises enrolled faces and marks attendance|face recognition attendance
Intruder Detection Camera|vision|ESP32-CAM OV2640;PIR sensor|Siren;Buzzer|sends a snapshot and sounds an alarm when motion is detected|intruder detection camera
Face Mask and PPE Check Gate|vision|ESP32-S3 camera|Servo gate;Buzzer|checks for a mask or helmet before opening the gate|PPE detection camera
Parking Occupancy Camera|vision|ESP32-CAM OV2640|OLED display|counts free parking spots from a camera view|parking occupancy detection
Crop Leaf Disease Detector|vision|ESP32-CAM OV2640|OLED display|classifies leaf photos as healthy or diseased|plant leaf disease detection
Fruit Ripeness Grader|vision|ESP32-CAM OV2640;TCS3200 colour sensor|Sorting servo;OLED display|grades fruit by colour and sorts it into bins|fruit ripeness detection
Camera Object Counter|vision|ESP32-CAM OV2640|OLED display|counts items passing a camera on a belt|object counting camera
Fire and Smoke Detection Camera|vision|ESP32-S3 camera;MQ-2 smoke sensor|Siren;Buzzer|spots flames and smoke in the picture and raises an alarm|fire detection camera
Wildlife Camera Trap|vision|ESP32-CAM OV2640;PIR sensor|microSD card|captures a photo when an animal passes and uploads it|wildlife camera trap
Elderly and Baby Monitoring Camera|vision|ESP32-CAM OV2640;INMP441 microphone|Buzzer|streams video and alerts on unusual sound or movement|home monitoring camera
Utility Meter OCR Reader|vision|ESP32-CAM OV2640|OLED display|reads analogue meter digits and uploads the value|meter reading OCR
Waste Segregation Classifier|vision|ESP32-S3 camera|Sorting servo;OLED display|identifies waste type and tilts it into the right bin|waste classification camera
QR Code Access Gate|vision|ESP32-CAM OV2640|Solenoid lock;Buzzer|opens a gate when a valid QR pass is scanned|QR code access control
Driver Drowsiness Camera|vision|ESP32-S3 camera|Buzzer;OLED display|watches the driver's eyes and sounds an alert on drowsiness|drowsiness detection camera
Line Following Robot|robot|IR sensor array|N20 geared motors;L298N driver|follows a track line and tunes its turns by error|line follower robot
Obstacle Avoiding Robot|robot|HC-SR04 ultrasonic;Servo scanner|N20 geared motors;L298N driver|scans ahead and steers around obstacles|obstacle avoiding robot
Fire Fighting Robot|robot|Flame sensors;HC-SR04 ultrasonic|Water pump;Servo nozzle;Motor driver|finds a flame and extinguishes it with water|fire fighting robot
Surveillance Robot|robot|ESP32-CAM OV2640;HC-SR04 ultrasonic|BO motors;L298N driver|streams live video while driven remotely|surveillance robot camera
Pick and Place Robotic Arm|robot|Potentiometers;Limit switches|MG996R servos;PCA9685 driver|picks and places light objects with smooth servo motion|robotic arm servo control
Warehouse Delivery Robot|robot|IR sensor array;RC522 RFID reader|N20 geared motors;L298N driver|follows lines and stops at RFID stations to deliver|warehouse delivery robot
Agricultural Seeding Robot|robot|HC-SR04 ultrasonic;Soil moisture sensor|BO motors;Servo seed dispenser|drives along rows and drops seeds at set spacing|agricultural robot seeding
Solar Panel Cleaning Robot|robot|Limit switches;LDR|DC gear motors;Motor driver|wipes a panel on a schedule and returns to its dock|solar panel cleaning robot
Duct and Pipe Inspection Robot|robot|ESP32-CAM OV2640;MPU6050|BO motors;LED lights|crawls through small spaces and sends back video|pipe inspection robot
Self-Balancing Robot|robot|MPU6050|N20 geared motors;TB6612FNG driver|stays upright by correcting tilt with a PID loop|self balancing robot
Maze Solver Robot|robot|IR sensors;HC-SR04 ultrasonic|N20 geared motors;Motor driver|maps a maze and finds the shortest path|maze solving robot
Hospital Medicine Delivery Robot|robot|IR sensor array;RC522 RFID reader|N20 geared motors;L298N driver|carries medicines along a marked route to each ward|hospital delivery robot
Metal Detecting Rescue Robot|robot|Metal detector coil;HC-SR04 ultrasonic|BO motors;Buzzer|searches ground for buried metal and marks the spot|mine detection robot
Water Surface Cleaning Boat|robot|HC-SR04 ultrasonic;NEO-6M GPS|Thrusters;Collection motor|collects floating litter and reports its position|water cleaning robot boat
Garbage Collecting Robot|robot|HC-SR04 ultrasonic;IR sensor|Gear motors;Servo gripper|moves to litter and picks it up|garbage collection robot
Person-Following Shopping Trolley|robot|HC-SR04 ultrasonic;HX711 load cell|Gear motors;Motor driver|follows the shopper and totals the weight carried|follow me robot trolley
'''.strip().splitlines()

def V(label, kw, clause, hw=(), sw=(), dom=None, hv=False, diff='Intermediate'):
    return dict(label=label, kw=kw, clause=clause, hw=list(hw), sw=list(sw), dom=dom, hv=hv, diff=diff)
LORA = V('LoRa Long-Range Link','LoRa','sends readings over LoRa to a gateway kilometres away, with no Wi-Fi or SIM needed',['SX1278 LoRa module (node)','SX1278 LoRa module (gateway)'],['LoRa library','ThingSpeak or Node-RED dashboard'],hv=True)
GSM = V('GSM SMS Alerts','GSM','texts alerts to the owner\'s phone so it works wherever there is a mobile signal',['SIM800L GSM module'],['TinyGSM library'])
MQTT = V('MQTT Cloud Dashboard','MQTT','publishes data over MQTT to a live cloud dashboard with history charts',[],['PubSubClient (MQTT)','Node-RED or ThingsBoard dashboard'],diff='Beginner')
SOLAR = V('Solar-Powered Low-Power Design','low power solar','runs from a small solar panel and a Li-ion cell using deep-sleep to last through cloudy days',['6V solar panel','TP4056 charger module','18650 Li-ion cell'],['ESP32 deep-sleep power management'])
TINY = V('TinyML Anomaly Detection','TinyML anomaly detection','learns normal behaviour with TinyML and flags abnormal patterns on the device itself',[],['Edge Impulse','TensorFlow Lite Micro'],dom='Edge AI',hv=True,diff='Advanced')
TELE = V('Telegram Bot Control','Telegram','sends alerts to a Telegram bot and accepts commands from the owner\'s chat',[],['UniversalTelegramBot library'],diff='Beginner')
BLE = V('BLE Mobile App','Bluetooth Low Energy','pairs with a phone app over Bluetooth Low Energy for control and live data',[],['ESP32 BLE library','MIT App Inventor or Flutter app'],diff='Beginner')
NOW = V('ESP-NOW Multi-Node Network','ESP-NOW','links several nodes directly with ESP-NOW, so no router is needed',['Second ESP32 node'],['ESP-NOW (esp_now.h)'])
HOME = V('Home Assistant Dashboard','Home Assistant MQTT','joins Home Assistant over MQTT for dashboards, automations and history',[],['PubSubClient (MQTT)','Home Assistant'],diff='Beginner')
VOICE = V('Google Assistant and Alexa Voice Control','voice control','answers voice commands from Google Assistant and Alexa through Sinric Pro',[],['SinricPro library'],diff='Beginner')
WEB = V('Local Web Dashboard with OTA Updates','web server OTA','hosts its own web dashboard and accepts over-the-air firmware updates',[],['ESPAsyncWebServer','ArduinoOTA'],diff='Beginner')
GPSG = V('GSM and GPS Location Alerts','GPS GSM','texts a Google Maps link of its position with every alert',['SIM800L GSM module','NEO-6M GPS'],['TinyGSM','TinyGPS++'])
LORAT = V('LoRa Tracking Network','LoRa tracking','reports position over LoRa to a gateway for areas without mobile signal',['SX1278 LoRa module (node)','SX1278 LoRa module (gateway)'],['LoRa library','TinyGPS++'],hv=True)
LOWP = V('Ultra-Low-Power Design','low power','is built for long battery life, sleeping between readings',['18650 Li-ion cell','TP4056 charger module'],['ESP32 deep-sleep power management'])
MODB = V('Modbus RS-485 Gateway','Modbus RS-485','speaks Modbus RTU over RS-485 so it plugs into industrial controllers',['MAX485 RS-485 module'],['ModbusMaster library'],hv=True)
RTOS = V('FreeRTOS Multi-Task Firmware','FreeRTOS real-time','splits sensing, control and communication into FreeRTOS tasks for deterministic timing',[],['FreeRTOS (ESP-IDF)'],dom='Real-time Hardware',hv=True,diff='Advanced')
OTA = V('OTA Fleet Updates','OTA update fleet','updates the firmware of many nodes over the air from one server',[],['HTTPUpdate OTA','Node-RED'],diff='Intermediate')
CAN = V('CAN Bus Link','CAN bus','shares data over a CAN bus between nodes',['MCP2515 CAN module','TJA1050 transceiver'],['mcp_can library'],diff='Advanced')
TGP = V('Telegram Photo Alerts','Telegram','sends a photo with every event to a Telegram chat',[],['UniversalTelegramBot library','ESP32 camera library'],diff='Beginner')
STREAM = V('Live Web Video Stream','video streaming','streams live video to any browser on the network',[],['ESP32 camera web server'],diff='Beginner')
EDGE = V('Edge Impulse On-Device Inference','Edge Impulse','runs a trained neural network on the device, with no cloud needed',[],['Edge Impulse','TensorFlow Lite Micro'],dom='Edge AI',hv=True,diff='Advanced')
FACE = V('ESP32-S3 On-Device Recognition','ESP32-S3 face recognition','runs recognition on the ESP32-S3 itself, so images stay on the device',[],['ESP-WHO','ESP-IDF'],dom='Edge AI',hv=True,diff='Advanced')
FIRE = V('Firebase Image and Data Upload','Firebase','uploads images and data to Firebase for a web or phone app',[],['Firebase ESP Client library'],diff='Intermediate')
BTCAR = V('Bluetooth App Control','Bluetooth','is driven from a phone over Bluetooth',[],['BluetoothSerial','MIT App Inventor app'],diff='Beginner')
JOY = V('Wi-Fi Web Joystick Control','WiFi web control','is driven from a web joystick in any phone browser',[],['ESPAsyncWebServer','WebSockets'],diff='Beginner')
GEST = V('Gesture Control with MPU6050','gesture MPU6050','follows hand-tilt gestures sensed by a wearable MPU6050',['MPU6050 wearable remote'],['ESP-NOW (esp_now.h)'],dom='Edge AI',hv=True,diff='Intermediate')
VOICE2 = V('Offline Voice Commands','voice recognition','obeys spoken commands recognised on the board',['INMP441 I2S microphone'],['ESP-SR or Edge Impulse'],dom='Edge AI',hv=True,diff='Advanced')
POOLS = {
 'field':[LORA,GSM,MQTT,SOLAR,TINY,TELE,BLE,NOW],
 'home':[HOME,BLE,TELE,VOICE,NOW,TINY,WEB,MQTT],
 'wear':[BLE,GPSG,LORAT,TINY,TELE,MQTT,LOWP,NOW],
 'ind':[MODB,MQTT,LORA,TINY,TELE,OTA,CAN,GSM],
 'vision':[TGP,MQTT,EDGE,STREAM,FACE,GSM,FIRE,NOW],
 'robot':[BTCAR,JOY,NOW,VOICE2,GEST,LORA,RTOS,TELE],
}
PFX = {'Wireless & IoT':'IOT','Edge AI':'EAI','Robotics':'ROB','Vision':'VIS','Real-time Hardware':'RTH'}
BASE_ADV = {
 'field':['Remote monitoring from anywhere','Low-cost, easy to replicate','Weather-ready node design','Scales from one node to many'],
 'home':['Control and status from your phone','Low-cost, off-the-shelf parts','Easy to extend with more sensors','Works with common smart-home apps'],
 'wear':['Compact and battery powered','Instant alerts to family or staff','Low-cost hardware','Easy to wear or mount'],
 'ind':['Early warning before breakdown','Fits existing machines','Remote visibility of the plant','Low-cost versus commercial loggers'],
 'vision':['Image evidence with every event','Low-cost camera module','Needs no PC at the edge','Easy to extend with new models'],
 'robot':['Simple, low-voltage hardware','Safe to demonstrate in a lab','Modular and easy to extend','Low-cost motors and drivers'],
}
APPL = {
 'field':['Farms and rural areas','Smart-city and municipal use','Research and demonstration'],
 'home':['Homes and apartments','Hospitals and care homes','Schools and offices'],
 'wear':['Personal safety','Healthcare and elder care','Fleet and logistics'],
 'ind':['Factories and workshops','Utilities and plants','Warehouses and logistics'],
 'vision':['Security and access control','Agriculture and food','Smart cities and retail'],
 'robot':['Education and competitions','Warehouses and hospitals','Agriculture and inspection'],
}
CLS_DOM = {'field':'Wireless & IoT','home':'Wireless & IoT','wear':'Wireless & IoT','ind':'Wireless & IoT','vision':'Vision','robot':'Robotics'}
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def xplore(q): return 'https://ieeexplore.ieee.org/search/searchresult.jsp?newsearch=true&queryText=%s&ranges=2023_2026_Year' % quote(q)
def xplore_all(q): return 'https://ieeexplore.ieee.org/search/searchresult.jsp?newsearch=true&queryText=%s' % quote(q)

# ---- curated set (drop critical power electronics: owner has no oscilloscope)
CRIT = re.compile(r'inverter|mppt|buck|boost|converter|bldc|\bfoc\b|smps|rectif|wireless charg|motor drive|\bvfd\b|\bpfc\b|three-phase|3-phase|h-bridge|dc-dc|bms|battery management|charger', re.I)
cur = json.load(open(os.path.join(HERE,'curated-projects.json')))
kept, dropped = [], []
for p in cur:
    blob = ' '.join([p['title'], *p.get('hardware',[])])
    (dropped if p['domain']=='Power Electronics' or CRIT.search(blob) else kept).append(p)
for p in kept:
    p.pop('diagram',None); p.pop('blockDiagramImage',None)
    p['ieeeQuery'] = re.sub(r'\b(using|with|and|based|for|the)\b',' ',p['title'],flags=re.I)
    p['difficulty'] = 'Advanced' if p['domain'] in ('Edge AI','Hardware ML') else 'Intermediate'
    p['source'] = 'curated'

# ---- generated set
gen, n = [], 0
for line in APPS:
    name, cls, sens, outs, does, kw = line.split('|')
    sens = sens.split(';'); outs = outs.split(';')
    for v in POOLS[cls]:
        n += 1
        dom = v['dom'] or CLS_DOM[cls]
        title = f"{name} with {v['label']}"
        board = 'ESP32-CAM' if cls=='vision' and dom!='Edge AI' else ('ESP32-S3' if dom=='Edge AI' or cls=='vision' else 'ESP32')
        hw = [f'{board} board', *sens, *outs, *v['hw'], 'Power supply (5V adapter or Li-ion)']
        sw = ['Arduino IDE / PlatformIO','Embedded C/C++', *v['sw']]
        low = ' '.join(w if (w[1:] != w[1:].lower() or any(c.isdigit() for c in w)) else w.lower() for w in name.split())
        abstract = f"An {board}-based {low} that {does}, and {v['clause']}."
        gen.append(dict(
            slug=slug(title), code=f"ISE-{PFX[dom]}-{1000+n}", title=title, domain=dom, year='2025-26',
            featured=False, highValue=v['hv'], difficulty=v['diff'], source='generated',
            abstract=abstract,
            existing=f"Without remote monitoring, a {low} depends on manual checks, so problems are found late and nothing is recorded.",
            proposed=f"An {board} reads {', '.join(sens[:-1])+' and '+sens[-1] if len(sens)>1 else sens[0]}, decides on the board and drives {', '.join(outs[:-1])+' and '+outs[-1] if len(outs)>1 else outs[0]}. It {v['clause']}. Readings and alerts reach the user in real time.",
            advantages=[*BASE_ADV[cls], 'Built on common open-source libraries'],
            applications=APPL[cls], hardware=hw, software=sw,
            ieeeQuery=f"{kw} {v['kw']}",
        ))
# unique slugs
seen=set()
for p in gen:
    s=p['slug']; k=2
    while s in seen: s=f"{p['slug']}-{k}"; k+=1
    p['slug']=s; seen.add(s)
for p in kept:
    if p['slug'] in seen: p['slug']+='-curated'
for p in kept+gen:
    p['ieee'] = p.get('ieee') or {'title':'','ref':''}
    p['ieeeUrl'] = xplore(p['ieeeQuery']); p['ieeeUrlAll'] = xplore_all(p['ieeeQuery'])
# featured: a spread of high-value generated + curated featured
for p in kept: pass
for i,p in enumerate([g for g in gen if g['highValue']]):
    if i % 28 == 0: p['featured'] = True
allp = kept + gen
json.dump(allp, open(OUT,'w'), ensure_ascii=False, separators=(',',':'))
from collections import Counter
print(len(allp),'projects (',len(kept),'curated kept,',len(dropped),'dropped,',len(gen),'generated )')
print(Counter(p['domain'] for p in allp)); print('high value',sum(p['highValue'] for p in allp),'featured',sum(p['featured'] for p in allp))
print('dropped:',[p['title'][:50] for p in dropped])
