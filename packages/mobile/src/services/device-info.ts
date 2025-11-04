/**
 * Device Info Service
 * 
 * Captures device information for EVV compliance and fraud detection.
 * This includes device model, OS version, root/jailbreak detection,
 * battery level, and network status.
 */

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import type { DeviceInfo } from '../shared/index.js';

export class DeviceInfoService {
  /**
   * Get comprehensive device information for EVV record
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const batteryLevel = await this.getBatteryLevel();
    const networkType = await this.getNetworkType();
    
    return {
      deviceId: await this.getDeviceId(),
      deviceModel: Device.modelName || 'Unknown',
      deviceOS: Device.osName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      appVersion: Constants.expoConfig?.version || '0.1.0',
      batteryLevel,
      networkType,
      isRooted: this.checkIfRooted(),
      isJailbroken: this.checkIfJailbroken(),
    };
  }

  /**
   * Get unique device identifier
   * 
   * Note: Uses installation ID, not hardware ID (HIPAA consideration).
   * Installation ID changes if app is uninstalled/reinstalled.
   */
  private async getDeviceId(): Promise<string> {
    // In production, use expo-application or secure storage
    return Constants.sessionId || 'device_unknown';
  }

  /**
   * Get current battery level (0-100)
   */
  private async getBatteryLevel(): Promise<number> {
    // TODO: Implement battery level detection
    // Requires: expo-battery or react-native-device-info
    return 100; // Placeholder
  }

  /**
   * Get network connection type
   */
  private async getNetworkType(): Promise<'WIFI' | '4G' | '5G' | 'ETHERNET' | 'OFFLINE'> {
    // TODO: Implement network type detection
    // Requires: @react-native-community/netinfo
    return 'WIFI'; // Placeholder
  }

  /**
   * Check if Android device is rooted
   * 
   * Root detection is important for fraud prevention as rooted
   * devices can bypass location security measures.
   */
  private checkIfRooted(): boolean {
    if (Device.osName !== 'Android') {
      return false;
    }

    // TODO: Implement root detection
    // Check for:
    // - su binary existence
    // - Magisk, SuperSU packages
    // - Test root access
    // - Check for known root files/directories
    
    return false; // Placeholder
  }

  /**
   * Check if iOS device is jailbroken
   * 
   * Jailbreak detection is important for fraud prevention.
   */
  private checkIfJailbroken(): boolean {
    if (Device.osName !== 'iOS') {
      return false;
    }

    // TODO: Implement jailbreak detection
    // Check for:
    // - Cydia app
    // - Fork, system, popen availability
    // - Known jailbreak files
    // - Sandbox escape attempts
    
    return false; // Placeholder
  }

  /**
   * Get device capabilities for EVV
   */
  async getDeviceCapabilities() {
    return {
      hasGPS: true, // Most modern devices have GPS
      hasCellular: Device.isDevice, // Physical device likely has cellular
      hasWiFi: true,
      hasBiometric: false, // TODO: Check if biometric hardware available
      hasCamera: Device.isDevice,
      batteryLevel: await this.getBatteryLevel(),
      isOnline: true, // TODO: Use NetInfo
      canBackgroundLocation: true, // TODO: Check permissions
    };
  }
}

export const deviceInfoService = new DeviceInfoService();
