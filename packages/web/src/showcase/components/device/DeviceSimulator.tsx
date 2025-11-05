/**
 * Mobile Device Frame Simulator
 *
 * Realistic device frames with touch simulation for mobile experiences
 */

import React, { useState } from 'react';
import { X, RotateCw, Smartphone, Tablet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DeviceConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  hasNotch: boolean;
  type: 'phone' | 'tablet';
}

export const DEVICE_CONFIGS: DeviceConfig[] = [
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    aspectRatio: '393/852',
    hasNotch: true,
    type: 'phone',
  },
  {
    id: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    width: 430,
    height: 932,
    aspectRatio: '430/932',
    hasNotch: true,
    type: 'phone',
  },
  {
    id: 'samsung-s24',
    name: 'Samsung Galaxy S24',
    width: 360,
    height: 780,
    aspectRatio: '360/780',
    hasNotch: false,
    type: 'phone',
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    width: 360,
    height: 820,
    aspectRatio: '360/820',
    hasNotch: false,
    type: 'phone',
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    aspectRatio: '834/1194',
    hasNotch: false,
    type: 'tablet',
  },
];

interface DeviceSimulatorProps {
  children: React.ReactNode;
  onClose?: () => void;
  defaultDevice?: string;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  children,
  onClose,
  defaultDevice = 'iphone-15-pro',
}) => {
  const [currentDevice, setCurrentDevice] = useState(
    DEVICE_CONFIGS.find(d => d.id === defaultDevice) || DEVICE_CONFIGS[0]
  );
  const [isLandscape, setIsLandscape] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  const handleRotate = () => {
    setIsLandscape(!isLandscape);
  };

  const handleDeviceChange = (device: DeviceConfig) => {
    setCurrentDevice(device);
    setShowDeviceSelector(false);
  };

  const deviceWidth = isLandscape ? currentDevice.height : currentDevice.width;
  const deviceHeight = isLandscape ? currentDevice.width : currentDevice.height;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 overflow-auto">
      {/* Controls Bar */}
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Device Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDeviceSelector(!showDeviceSelector)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              {currentDevice.type === 'phone' ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Tablet className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{currentDevice.name}</span>
            </button>

            {showDeviceSelector && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-700 rounded-lg shadow-xl border border-gray-600 overflow-hidden">
                <div className="p-2">
                  {DEVICE_CONFIGS.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleDeviceChange(device)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-600 transition-colors ${
                        currentDevice.id === device.id ? 'bg-gray-600 text-white' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {device.type === 'phone' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Tablet className="h-4 w-4" />
                        )}
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-gray-400">
                            {device.width} × {device.height}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rotate Button */}
          <button
            onClick={handleRotate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            title="Rotate Device"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-sm">Rotate</span>
          </button>

          {/* Device Info */}
          <div className="text-sm text-gray-400">
            {deviceWidth} × {deviceHeight} • {isLandscape ? 'Landscape' : 'Portrait'}
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Exit Device Simulator"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Device Frame */}
      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-64px)]">
        <motion.div
          key={`${currentDevice.id}-${isLandscape}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
          style={{
            width: `${deviceWidth}px`,
            maxWidth: '95vw',
          }}
        >
          {/* Device Chrome */}
          <div
            className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl"
            style={{
              aspectRatio: `${deviceWidth}/${deviceHeight}`,
            }}
          >
            {/* Notch (for iPhones) */}
            {currentDevice.hasNotch && !isLandscape && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10" />
            )}

            {/* Screen */}
            <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-white z-10 flex items-center justify-between px-6 text-xs font-semibold text-gray-900">
                <span>2:30 PM</span>
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <span>●●●●</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Content Area */}
              <div className="absolute inset-0 pt-8 pb-6 overflow-auto">
                {children}
              </div>

              {/* Home Indicator (for iPhones) */}
              {currentDevice.hasNotch && !isLandscape && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-900 rounded-full opacity-40" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
