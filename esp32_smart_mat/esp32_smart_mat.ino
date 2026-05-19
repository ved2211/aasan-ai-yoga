#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Match these UUIDs exactly with the ones in useSmartMat.js (React Frontend)
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID    "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;

// GPIO Pins for Analog Sensors
// Assume 4 FSR (Force Sensitive Resistors) for pressure
const int pinPressureTL = 32;
const int pinPressureTR = 33;
const int pinPressureBL = 34;
const int pinPressureBR = 35;

// Assume 1 Moisture/Sweat sensor
const int pinMoisture = 36; 

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Device connected.");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Device disconnected.");
      // Restart advertising so the app can reconnect
      BLEDevice::startAdvertising();
    }
};

void setup() {
  Serial.begin(115200);

  // Configure Analog Pins
  pinMode(pinPressureTL, INPUT);
  pinMode(pinPressureTR, INPUT);
  pinMode(pinPressureBL, INPUT);
  pinMode(pinPressureBR, INPUT);
  pinMode(pinMoisture, INPUT);

  // Initialize BLE
  Serial.println("Initializing BLE...");
  BLEDevice::init("SmartYoga Mat"); // Prefix must match React app filter
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  // Add Descriptor for Notifications
  pCharacteristic->addDescriptor(new BLE2902());

  // Start Service
  pService->start();

  // Start Advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  Serial.println("BLE Advertising Started. Waiting for connections...");
}

void loop() {
  if (deviceConnected) {
    // 1. Read Raw Analog Values (0-4095 on ESP32)
    int rawTL = analogRead(pinPressureTL);
    int rawTR = analogRead(pinPressureTR);
    int rawBL = analogRead(pinPressureBL);
    int rawBR = analogRead(pinPressureBR);
    int rawMoisture = analogRead(pinMoisture);

    // 2. Map values to 8-bit integers (0-255) for efficient Bluetooth transmission
    uint8_t pTL = map(rawTL, 0, 4095, 0, 255);
    uint8_t pTR = map(rawTR, 0, 4095, 0, 255);
    uint8_t pBL = map(rawBL, 0, 4095, 0, 255);
    uint8_t pBR = map(rawBR, 0, 4095, 0, 255);
    uint8_t moisture = map(rawMoisture, 0, 4095, 0, 255);

    // 3. Create a 5-byte payload array
    // Payload Format: [Pressure_TopLeft, Pressure_TopRight, Pressure_BotLeft, Pressure_BotRight, Moisture]
    uint8_t payload[5];
    payload[0] = pTL;
    payload[1] = pTR;
    payload[2] = pBL;
    payload[3] = pBR;
    payload[4] = moisture;

    // 4. Update the BLE Characteristic Value
    pCharacteristic->setValue(payload, sizeof(payload));
    
    // 5. Notify the connected client (React App)
    pCharacteristic->notify();
    
    // Debug output
    Serial.printf("Sent -> TL:%d TR:%d BL:%d BR:%d Moist:%d\n", pTL, pTR, pBL, pBR, moisture);
    
    // Small delay to prevent network congestion (updates 10 times a second)
    delay(100); 
  } else {
    // If not connected, wait a bit longer to save power
    delay(500);
  }
}
