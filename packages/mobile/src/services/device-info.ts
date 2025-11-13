/**
 * Device Info Service
 *
 * Captures device information for EVV compliance and fraud detection.
 * This includes device model, OS version, root/jailbreak detection,
 * battery level, and network status.
 */

import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import type { DeviceInfo } from '../shared/index';

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
  async getBatteryLevel(): Promise<number> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      // Convert from 0-1 to 0-100
      return Math.round(batteryLevel * 100);
    } catch (error) {
      console.warn('Failed to get battery level:', error);
      return 100; // Return 100 as fallback if unable to detect
    }
  }

  /**
   * Get network connection type
   */
  private async getNetworkType(): Promise<'WIFI' | '4G' | '5G' | 'ETHERNET' | 'OFFLINE'> {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected || !state.isInternetReachable) {
        return 'OFFLINE';
      }

      switch (state.type) {
        case 'wifi':
          return 'WIFI';
        case 'ethernet':
          return 'ETHERNET';
        case 'cellular': {
          // Try to determine if 4G or 5G based on details
          const cellularGeneration = state.details?.cellularGeneration;
          if (cellularGeneration === '5g') {
            return '5G';
          }
          // Default to 4G for cellular connections
          return '4G';
        }
        default:
          return 'WIFI'; // Fallback to WIFI for unknown types
      }
    } catch (error) {
      console.warn('Failed to get network type:', error);
      return 'WIFI'; // Fallback
    }
  }

  /**
   * Check if Android device is rooted
   *
   * Root detection is important for fraud prevention as rooted
   * devices can bypass location security measures.
   *
   * Note: This is basic detection. For production, consider using
   * a native module with more comprehensive checks.
   */
  private checkIfRooted(): boolean {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      // Check build tags for test-keys (common on rooted devices)
      const buildTags = String(Constants.systemVersion || '');
      if (buildTags.includes('test-keys')) {
        return true;
      }

      // In React Native/Expo, we have limited ability to check files
      // For more comprehensive detection, a native module would be needed
      // that checks for:
      // - su binary in /system/bin, /system/xbin, /sbin, /system/sd/xbin
      // - Busybox binary
      // - Root management apps (Magisk, SuperSU, etc.)
      // - Dangerous system properties
      // - Ability to execute su commands

      // For now, return false as we cannot reliably detect without native code
      // This should be enhanced with a native module for production
      return false;
    } catch (error) {
      console.warn('Root detection check failed:', error);
      return false;
    }
  }

  /**
   * Check if iOS device is jailbroken
   *
   * Jailbreak detection is important for fraud prevention.
   *
   * Note: This is basic detection. For production, consider using
   * a native module with more comprehensive checks.
   */
  private checkIfJailbroken(): boolean {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      // In React Native/Expo, we have limited ability to detect jailbreak
      // For comprehensive detection, a native module would be needed that checks:
      // - Cydia app (cydia:// URL scheme)
      // - Common jailbreak files (/Applications/Cydia.app, /Library/MobileSubstrate, etc.)
      // - Ability to write outside app sandbox
      // - Fork/system/popen function availability
      // - Suspicious dyld environment variables
      // - Symbolic links in /Applications

      // Check if running on simulator (simulators are development tools, not jailbroken)
      if (!Device.isDevice) {
        return false;
      }

      // For production, this should be implemented with a native module
      // that performs comprehensive jailbreak detection
      return false;
    } catch (error) {
      console.warn('Jailbreak detection check failed:', error);
      return false;
    }
  }

  /**
   * Get device capabilities for EVV
   */
  async getDeviceCapabilities() {
    const networkState = await NetInfo.fetch();

    return {
      hasGPS: true, // Most modern devices have GPS
      hasCellular: Device.isDevice, // Physical device likely has cellular
      hasWiFi: true,
      hasBiometric: false, // TODO: Check if biometric hardware available (requires expo-local-authentication)
      hasCamera: Device.isDevice,
      batteryLevel: await this.getBatteryLevel(),
      isOnline: networkState.isConnected && networkState.isInternetReachable,
      canBackgroundLocation: true, // TODO: Check permissions (requires expo-location permissions check)
    };
  }
}

export const deviceInfoService = new DeviceInfoService();
