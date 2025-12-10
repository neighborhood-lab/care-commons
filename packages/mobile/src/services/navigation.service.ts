/**
 * Navigation Service
 *
 * Provides turn-by-turn navigation to patient addresses by opening
 * the device's native maps application.
 *
 * Features:
 * - Opens Apple Maps on iOS, Google Maps on Android
 * - Supports address-based navigation
 * - Supports coordinate-based navigation
 * - Falls back gracefully if maps app unavailable
 */

import { Linking, Platform, Alert } from 'react-native';

export interface NavigationDestination {
  address?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
}

export class NavigationService {
  /**
   * Open the device's maps app with turn-by-turn directions to a destination
   */
  async navigateTo(destination: NavigationDestination): Promise<boolean> {
    const { address, latitude, longitude, label } = destination;

    // Prefer coordinates if available
    if (latitude !== undefined && longitude !== undefined) {
      return this.navigateToCoordinates(latitude, longitude, label);
    }

    // Fall back to address
    if (address) {
      return this.navigateToAddress(address, label);
    }

    Alert.alert('Navigation Error', 'No address or coordinates provided');
    return false;
  }

  /**
   * Navigate to GPS coordinates
   */
  async navigateToCoordinates(
    latitude: number,
    longitude: number,
    label?: string
  ): Promise<boolean> {
    const encodedLabel = label ? encodeURIComponent(label) : '';

    // Platform-specific URLs
    const url = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}&dirflg=d${encodedLabel ? `&q=${encodedLabel}` : ''}`,
      android: `google.navigation:q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    });

    return this.openMapsUrl(url);
  }

  /**
   * Navigate to a street address
   */
  async navigateToAddress(address: string, _label?: string): Promise<boolean> {
    const encodedAddress = encodeURIComponent(address);

    // Platform-specific URLs
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}&dirflg=d`,
      android: `google.navigation:q=${encodedAddress}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    });

    return this.openMapsUrl(url);
  }

  /**
   * Open maps to show a location (without navigation)
   */
  async showLocation(destination: NavigationDestination): Promise<boolean> {
    const { address, latitude, longitude, label } = destination;

    let url: string;

    if (latitude !== undefined && longitude !== undefined) {
      const encodedLabel = label ? encodeURIComponent(label) : '';
      url = Platform.select({
        ios: `maps://app?ll=${latitude},${longitude}${encodedLabel ? `&q=${encodedLabel}` : ''}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}${encodedLabel ? `(${encodedLabel})` : ''}`,
        default: `https://www.google.com/maps/@${latitude},${longitude},15z`,
      }) as string;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      url = Platform.select({
        ios: `maps://app?q=${encodedAddress}`,
        android: `geo:0,0?q=${encodedAddress}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      }) as string;
    } else {
      Alert.alert('Location Error', 'No address or coordinates provided');
      return false;
    }

    return this.openMapsUrl(url);
  }

  /**
   * Check if maps app is available
   */
  async canOpenMaps(): Promise<boolean> {
    const testUrl = Platform.select({
      ios: 'maps://',
      android: 'google.navigation:q=0,0',
      default: 'https://www.google.com/maps',
    });

    try {
      return await Linking.canOpenURL(testUrl as string);
    } catch {
      return false;
    }
  }

  /**
   * Open a maps URL with error handling
   */
  private async openMapsUrl(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        // Try web fallback
        const webUrl = this.getWebFallbackUrl(url);
        if (webUrl) {
          const canOpenWeb = await Linking.canOpenURL(webUrl);
          if (canOpenWeb) {
            await Linking.openURL(webUrl);
            return true;
          }
        }

        Alert.alert('Maps Not Available', 'Unable to open maps application. Please ensure you have a maps app installed.');
        return false;
      }

      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Failed to open maps application. Please try again.');
      return false;
    }
  }

  /**
   * Convert native URL to web URL for fallback
   */
  private getWebFallbackUrl(url: string): string | null {
    // Extract destination from native URLs
    const coordMatch = url.match(/(?:daddr=|q=)([-\d.]+),([-\d.]+)/);
    if (coordMatch) {
      const [, lat, lng] = coordMatch;
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }

    const addressMatch = url.match(/(?:daddr=|q=)([^&]+)/);
    if (addressMatch) {
      const address = addressMatch[1];
      return `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    }

    return null;
  }
}

export const navigationService = new NavigationService();
