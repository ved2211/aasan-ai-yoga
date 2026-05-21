import { useState, useCallback, useRef } from 'react';

// Replace these UUIDs with your ESP32's actual UUIDs when you flash the C++ code
const SMART_MAT_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SENSOR_DATA_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export const useSmartMat = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [pressureData, setPressureData] = useState([0, 0, 0, 0]); // 4 zones: Top-L, Top-R, Bot-L, Bot-R
  const [error, setError] = useState(null);
  
  const gattServerRef = useRef(null);

  const connectMat = useCallback(async () => {
    try {
      if (!navigator.bluetooth) {
        setError('Web Bluetooth API is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      setError(null);
      
      // Request the Bluetooth device through the browser's native pairing UI
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'SmartYoga' }],
        optionalServices: [SMART_MAT_SERVICE_UUID]
      });

      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setError('Smart Mat disconnected.');
      });

      // Connect to GATT server
      const server = await device.gatt.connect();
      gattServerRef.current = server;
      
      // Get the Primary Service
      const service = await server.getPrimaryService(SMART_MAT_SERVICE_UUID);
      
      // Get Characteristic
      const characteristic = await service.getCharacteristic(SENSOR_DATA_CHAR_UUID);
      
      // Start listening for continuous data stream
      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        
        // Debug logging to pinpoint exactly what the browser receives
        const bytes = [];
        for (let i = 0; i < value.byteLength; i++) {
          bytes.push(value.getUint8(i));
        }
        console.log(">>> BLE Received Bytes:", bytes);
        
        if (value.byteLength >= 4) {
          const pTL = value.getUint8(0);
          const pTR = value.getUint8(1);
          const pBL = value.getUint8(2);
          const pBR = value.getUint8(3);
          setPressureData([pTL, pTR, pBL, pBR]);
        }
      });

      setIsConnected(true);
    } catch (err) {
      console.error("Bluetooth connection error: ", err);
      if (err.name === 'NotFoundError' || err.message.includes('User cancelled')) {
        setError("Device not found or pairing cancelled.");
      } else {
        setError(err.message || 'Bluetooth connection failed.');
      }
    }
  }, []);

  const disconnectMat = useCallback(() => {
    if (gattServerRef.current) {
      gattServerRef.current.disconnect();
    }
    setIsConnected(false);
  }, []);

  // Utility to simulate data if you don't have the hardware built yet
  const simulateConnection = useCallback(() => {
    setIsConnected(true);
    setError(null);
    setInterval(() => {
      setPressureData([
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255),
        Math.floor(Math.random() * 255)
      ]);
    }, 1000); // update every second
  }, []);

  return { isConnected, pressureData, connectMat, disconnectMat, simulateConnection, error };
};
