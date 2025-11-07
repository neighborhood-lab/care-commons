/**
 * Biometric Authentication Service
 *
 * Handles biometric authentication with:
 * - Device capability detection
 * - Biometric enrollment check
 * - Authentication prompts
 * - Biometric settings management
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export class BiometricService {
  /**
   * Check if device supports biometrics
   */
  static async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  /**
   * Get available biometric types
   */
  static async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  /**
   * Authenticate with biometrics
   */
  static async authenticate(reason: string): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  /**
   * Enable biometric login for user
   */
  static async enableBiometricLogin(): Promise<boolean> {
    const success = await this.authenticate('Enable biometric login');
    if (success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    }
    return false;
  }

  /**
   * Disable biometric login
   */
  static async disableBiometricLogin(): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
  }

  /**
   * Check if biometric login is enabled
   */
  static async isBiometricEnabled(): Promise<boolean> {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  /**
   * Get biometric type name for display
   */
  static async getBiometricTypeName(): Promise<string> {
    const types = await this.getSupportedTypes();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }

    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }

    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Scan';
    }

    return 'Biometric';
  }
}
