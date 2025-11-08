/**
 * Geocoding service for converting addresses to lat/lng coordinates
 * Supports multiple providers: Google Maps, Mapbox, and Nominatim (OpenStreetMap)
 */

import type { Address } from '../types/organization.js';

export type GeocodingConfidence = 'high' | 'medium' | 'low';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: GeocodingConfidence;
}

export type GeocodingProvider = 'google' | 'mapbox' | 'nominatim';

export class GeocodingService {
  private apiKey: string;
  private provider: GeocodingProvider;

  constructor(provider: GeocodingProvider = 'mapbox') {
    this.provider = provider;
    this.apiKey = process.env.GEOCODING_API_KEY ?? '';
  }

  /**
   * Geocode an address to lat/lng coordinates
   * Supports both core Address type (street1/zipCode) and client Address type (line1/postalCode)
   */
  async geocodeAddress(address: Address | { line1: string; city: string; state: string; postalCode: string }): Promise<GeocodingResult | null> {
    // Support both address formats
    const street = 'street1' in address ? address.street1 : address.line1;
    const zip = 'zipCode' in address ? address.zipCode : address.postalCode;
    const fullAddress = `${street}, ${address.city}, ${address.state} ${zip}`;

    switch (this.provider) {
      case 'google':
        return this.geocodeWithGoogle(fullAddress);
      case 'mapbox':
        return this.geocodeWithMapbox(fullAddress);
      case 'nominatim':
        return this.geocodeWithNominatim(fullAddress);
      default:
        throw new Error(`Unknown geocoding provider: ${this.provider}`);
    }
  }

  /**
   * Geocode with Google Maps API
   */
  private async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    try {
      const url = new globalThis.URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', address);
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json() as {
        status: string;
        results: Array<{
          geometry: {
            location: { lat: number; lng: number };
            location_type: string;
          };
          formatted_address: string;
        }>;
      };

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        if (result === undefined) return null;

        const location = result.geometry.location;

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          confidence: this.getConfidenceFromLocationType(result.geometry.location_type)
        };
      }

      console.warn(`Geocoding failed for: ${address}`, data.status);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with Mapbox API
   */
  private async geocodeWithMapbox(address: string): Promise<GeocodingResult | null> {
    try {
      const url = new globalThis.URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`);
      url.searchParams.set('access_token', this.apiKey);
      url.searchParams.set('country', 'US');
      url.searchParams.set('types', 'address');

      const response = await fetch(url.toString());
      const data = await response.json() as {
        features: Array<{
          center: [number, number];
          place_name: string;
          relevance: number;
        }>;
      };

      if (data.features.length > 0) {
        const feature = data.features[0];
        if (feature === undefined) return null;

        const [longitude, latitude] = feature.center;

        // Determine confidence based on relevance score
        let confidence: GeocodingConfidence;
        if (feature.relevance > 0.8) {
          confidence = 'high';
        } else if (feature.relevance > 0.5) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }

        return {
          latitude,
          longitude,
          formattedAddress: feature.place_name,
          confidence
        };
      }

      console.warn(`Geocoding failed for: ${address}`);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with Nominatim (OpenStreetMap)
   * NOTE: Rate-limited, not recommended for production
   */
  private async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      const url = new globalThis.URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', address);
      url.searchParams.set('format', 'json');
      url.searchParams.set('countrycodes', 'us');
      url.searchParams.set('limit', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'CareCommons/1.0'
        }
      });

      const data = await response.json() as Array<{
        lat: string;
        lon: string;
        display_name: string;
        importance: number;
      }>;

      if (data.length > 0) {
        const result = data[0];
        if (result === undefined) return null;

        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          confidence: result.importance > 0.5 ? 'high' : 'medium'
        };
      }

      console.warn(`Geocoding failed for: ${address}`);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private getConfidenceFromLocationType(locationType: string): GeocodingConfidence {
    switch (locationType) {
      case 'ROOFTOP':
        return 'high';
      case 'RANGE_INTERPOLATED':
        return 'medium';
      case 'GEOMETRIC_CENTER':
      case 'APPROXIMATE':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Reverse geocode: get address from lat/lng
   * Useful for verifying GPS coordinates
   */
  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    // Implementation depends on provider
    // This is a placeholder for future implementation
    console.log(`Reverse geocoding not yet implemented for ${this.provider}: ${lat}, ${lng}`);
    return null;
  }
}
