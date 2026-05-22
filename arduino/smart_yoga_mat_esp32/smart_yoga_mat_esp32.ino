/*
  ================================================================================
  Smart Yoga Mat - ESP32 BLE Firmware (4-Sensor Clean Version)
  ================================================================================
  This firmware reads 4 pressure sensors (Force Sensitive Resistors / FSRs)
  on the ESP32's ADC1 pins, maps the 12-bit analog signals (0-4095) down to 
  8-bit bytes (0-255), and streams them in real-time over Web Bluetooth (BLE) 
  to the React Web Application. 
  
  All moisture/sweat sensor code has been completely removed.
  
  NOTE: Bottom-Left and Bottom-Right pins are mapped to 35 and 34 in software.
  Top-Left is pin 33, and Top-Right is pin 32.

  Web Bluetooth Specs:
  - Device Name: SmartYoga Mat (advertised prefix 'SmartYoga')
  - Primary Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
  - Characteristic UUID:  beb5483e-36e1-4688-b7f5-ea07361b26a8 (Read & Notify)
  - Data format (4 bytes): [PressureTL, PressureTR, PressureBL, PressureBR]
  ================================================================================
*/

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE Server & Service Configuration
#define DEVICE_NAME             "SmartYoga Mat"
#define SERVICE_UUID            "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID     "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Hardware Pin Layout (All on ADC1)
#define PIN_PRESSURE_TL         33  // VP Pin - Top Left FSR
#define PIN_PRESSURE_TR         32  // VN Pin - Top Right FSR
#define PIN_PRESSURE_BL         35  // GPIO 35 - Bottom Left FSR (Swapped to 35)
#define PIN_PRESSURE_BR         34  // GPIO 34 - Bottom Right FSR (Swapped to 34)

// Global BLE Variables
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false;

// Connection Callbacks to track active connections
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* server) override {
    deviceConnected = true;
    Serial.println(">>> Web Bluetooth client connected!");
  }

  void onDisconnect(BLEServer* server) override {
    deviceConnected = false;
    Serial.println(">>> Client disconnected. Restarting advertising...");
    delay(500); // Give the BLE stack time to settle
    pServer->startAdvertising();
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("=========================================");
  Serial.println("Initializing Smart Yoga Mat BLE Firmware (4-Sensor)...");
  Serial.println("=========================================");

  // Configure Analog Pins (Inputs)
  pinMode(PIN_PRESSURE_TL, INPUT);
  pinMode(PIN_PRESSURE_TR, INPUT);
  pinMode(PIN_PRESSURE_BL, INPUT);
  pinMode(PIN_PRESSURE_BR, INPUT);

  // Set ADC attenuation for full scale 0-3.3V range (12-bit: 0-4095)
  analogSetAttenuation(ADC_11db);

  // 1. Initialize BLE Device
  BLEDevice::init(DEVICE_NAME);

  // 2. Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // 3. Create the Primary BLE Service
  BLEService* pService = pServer->createService(SERVICE_UUID);

  // 4. Create the BLE Characteristic with READ and NOTIFY properties
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );

  // 5. Create a BLE Descriptor for Client Characteristic Configuration (needed for Web Bluetooth Notifications)
  pCharacteristic->addDescriptor(new BLE2902());

  // 6. Start the Service
  pService->start();

  // 7. Configure and Start Advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // Android compatibility parameters
  pAdvertising->setMinPreferred(0x12);
  
  BLEDevice::startAdvertising();
  Serial.println("BLE Server successfully started and advertising!");
  Serial.print("Device Name: ");
  Serial.println(DEVICE_NAME);
  Serial.print("Service UUID: ");
  Serial.println(SERVICE_UUID);
  Serial.print("Characteristic UUID: ");
  Serial.println(CHARACTERISTIC_UUID);
  Serial.println("Waiting for connection...");
}

void loop() {
  // A. Read raw 12-bit values (0 to 4095)
  int rawTL = analogRead(PIN_PRESSURE_TL);
  int rawTR = analogRead(PIN_PRESSURE_TR);
  int rawBL = analogRead(PIN_PRESSURE_BL);
  int rawBR = analogRead(PIN_PRESSURE_BR);

  // B. Map 12-bit inputs to 8-bit unsigned bytes (0 to 255)
  uint8_t byteTL = constrain(rawTL / 16, 0, 255);
  uint8_t byteTR = constrain(rawTR / 16, 0, 255);
  uint8_t byteBL = constrain(rawBL / 16, 0, 255);
  uint8_t byteBR = constrain(rawBR / 16, 0, 255);

  // C. Package the values into a 4-byte array
  uint8_t sensorPayload[4];
  sensorPayload[0] = byteTL;
  sensorPayload[1] = byteTR;
  sensorPayload[2] = byteBL;
  sensorPayload[3] = byteBR;

  // D. Update BLE Characteristic and notify the Web App if connected
  if (deviceConnected) {
    pCharacteristic->setValue(sensorPayload, 4);
    pCharacteristic->notify();
  }

  // E. ALWAYS print values to Serial Monitor for easy physical hardware testing!
  Serial.printf("TL: %3d | TR: %3d | BL: %3d | BR: %3d [BLE: %s]\n", 
                byteTL, byteTR, byteBL, byteBR, 
                deviceConnected ? "CONNECTED" : "DISCONNECTED");

  // Stream rate: Update every 150ms for highly responsive real-time feedback
  delay(150);
}
