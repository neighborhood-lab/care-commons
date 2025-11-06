# Task 0025: Automated Client Address Geocoding

**Priority**: 🔴 CRITICAL
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 4-5 hours

## Context

GPS-based EVV and route optimization require geocoded addresses (latitude/longitude coordinates). Currently, addresses must be manually geocoded. This is error-prone and slows down client onboarding.

## Problem Statement

**Current Issues**:
- Addresses entered without coordinates
- Manual geocoding step required
- Scheduling fails if address not geocoded
- EVV check-in fails if client has no coordinates
- Coordinators don't know which clients need geocoding

**Impact**:
- Visit scheduling blocked
- EVV compliance failures
- Poor UX for coordinators
- Route optimization can't include un-geocoded clients

## Task

### 1. Integrate Geocoding Service

Choose a geocoding provider:
- **Google Maps Geocoding API** (Most accurate, costs money)
- **Mapbox Geocoding API** (Good, reasonable pricing)
- **Nominatim** (Free, OpenStreetMap, rate-limited)

**File**: `packages/core/src/services/geocoding.service.ts`

```typescript
import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: 'high' | 'medium' | 'low';
}

export class GeocodingService {
  private apiKey: string;
  private provider: 'google' | 'mapbox' | 'nominatim';

  constructor(provider: 'google' | 'mapbox' | 'nominatim' = 'mapbox') {
    this.provider = provider;
    this.apiKey = process.env.GEOCODING_API_KEY || '';
  }

  /**
   * Geocode an address to lat/lng coordinates
   */
  async geocodeAddress(address: Address): Promise<GeocodingResult | null> {
    const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zip}`;

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
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: this.apiKey
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: result.formatted_address,
          confidence: this.getConfidenceFromLocationType(result.geometry.location_type)
        };
      }

      console.warn(`Geocoding failed for: ${address}`, response.data.status);
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
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: this.apiKey,
            country: 'US', // Limit to US addresses
            types: 'address' // Only geocode addresses (not places, POIs)
          }
        }
      );

      if (response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [longitude, latitude] = feature.center;

        return {
          latitude,
          longitude,
          formattedAddress: feature.place_name,
          confidence: feature.relevance > 0.8 ? 'high' : feature.relevance > 0.5 ? 'medium' : 'low'
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
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          countrycodes: 'us',
          limit: 1
        },
        headers: {
          'User-Agent': 'CareCommons/1.0' // Required by Nominatim
        }
      });

      if (response.data.length > 0) {
        const result = response.data[0];

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

  private getConfidenceFromLocationType(locationType: string): 'high' | 'medium' | 'low' {
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
   */
  async reverseGeocode(lat: number, lng: number): Promise<Address | null> {
    // Implementation depends on provider
    // Useful for verifying GPS coordinates
    return null;
  }
}
```

### 2. Auto-Geocode on Client Create/Update

**File**: `verticals/client-demographics/src/services/client.service.ts`

```typescript
import { GeocodingService } from '@care-commons/core/services/geocoding.service';

export class ClientService {
  private geocodingService: GeocodingService;

  constructor(private db: Knex) {
    this.geocodingService = new GeocodingService('mapbox');
  }

  async createClient(data: CreateClientInput): Promise<Client> {
    // Geocode address automatically
    if (data.address) {
      const geocoded = await this.geocodingService.geocodeAddress(data.address);

      if (geocoded) {
        data.coordinates = {
          lat: geocoded.latitude,
          lng: geocoded.longitude
        };
        data.geocoding_confidence = geocoded.confidence;
        data.geocoded_at = new Date();
      } else {
        console.warn(`Failed to geocode address for new client: ${data.address.street}`);
        // Don't fail client creation, just log warning
      }
    }

    const [client] = await this.db('clients')
      .insert(data)
      .returning('*');

    return client;
  }

  async updateClient(clientId: string, data: UpdateClientInput): Promise<Client> {
    // If address changed, re-geocode
    if (data.address) {
      const geocoded = await this.geocodingService.geocodeAddress(data.address);

      if (geocoded) {
        data.coordinates = {
          lat: geocoded.latitude,
          lng: geocoded.longitude
        };
        data.geocoding_confidence = geocoded.confidence;
        data.geocoded_at = new Date();
      }
    }

    const [client] = await this.db('clients')
      .where({ id: clientId })
      .update(data)
      .returning('*');

    return client;
  }
}
```

### 3. Add Geocoding Status to Client Schema

**Migration**: `migrations/YYYYMMDDHHMMSS_add_geocoding_columns.ts`

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('clients', (table) => {
    table.jsonb('coordinates').nullable(); // { lat: number, lng: number }
    table.enum('geocoding_confidence', ['high', 'medium', 'low']).nullable();
    table.timestamp('geocoded_at').nullable();
    table.boolean('geocoding_failed').defaultTo(false);
  });

  // Index for spatial queries
  await knex.raw(`
    CREATE INDEX idx_clients_coordinates
    ON clients USING gist ((coordinates::jsonb->>'lat')::float, (coordinates::jsonb->>'lng')::float);
  `);
}
```

### 4. Create Geocoding Queue for Existing Clients

**File**: `scripts/geocode-clients.ts`

```typescript
#!/usr/bin/env tsx

import { db } from '../packages/core/src/db';
import { GeocodingService } from '../packages/core/src/services/geocoding.service';

async function geocodeExistingClients() {
  const geocodingService = new GeocodingService('mapbox');

  // Find clients without coordinates
  const clients = await db('clients')
    .whereNull('coordinates')
    .whereNotNull('address')
    .where('geocoding_failed', false)
    .orderBy('created_at', 'desc');

  console.log(`Found ${clients.length} clients to geocode`);

  let successCount = 0;
  let failCount = 0;

  for (const client of clients) {
    try {
      console.log(`Geocoding: ${client.first_name} ${client.last_name} - ${client.address.street}`);

      const result = await geocodingService.geocodeAddress(client.address);

      if (result) {
        await db('clients')
          .where({ id: client.id })
          .update({
            coordinates: { lat: result.latitude, lng: result.longitude },
            geocoding_confidence: result.confidence,
            geocoded_at: new Date()
          });

        successCount++;
        console.log(`  ✓ Success: ${result.latitude}, ${result.longitude}`);
      } else {
        await db('clients')
          .where({ id: client.id })
          .update({ geocoding_failed: true });

        failCount++;
        console.log(`  ✗ Failed to geocode`);
      }

      // Rate limiting (1 request per second for free tiers)
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`  ✗ Error geocoding client ${client.id}:`, error);
      failCount++;
    }
  }

  console.log(`\nGeocoding complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Failed: ${failCount}`);

  await db.destroy();
}

geocodeExistingClients();
```

### 5. Add Manual Geocode Button in UI

**File**: `packages/web/src/components/clients/ClientAddressForm.tsx`

```typescript
const ClientAddressForm = ({ clientId, address }) => {
  const [geocoding, setGeocoding] = useState(false);
  const { mutate: geocodeAddress } = useGeocodeAddress();

  const handleManualGeocode = async () => {
    setGeocoding(true);
    try {
      await geocodeAddress(clientId);
      toast.success('Address geocoded successfully');
    } catch (error) {
      toast.error('Failed to geocode address');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div>
      <Input label="Street" {...register('address.street')} />
      <Input label="City" {...register('address.city')} />
      {/* ... other fields */}

      {!address.coordinates && (
        <button
          type="button"
          onClick={handleManualGeocode}
          disabled={geocoding}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          {geocoding ? 'Geocoding...' : '📍 Geocode Address'}
        </button>
      )}

      {address.coordinates && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="text-green-600">✓</span> Geocoded
          ({address.coordinates.lat.toFixed(4)}, {address.coordinates.lng.toFixed(4)})
          <span className="ml-2 text-xs">
            Confidence: {address.geocoding_confidence}
          </span>
        </div>
      )}
    </div>
  );
};
```

### 6. Add Geocoding Health Check

**File**: `packages/app/src/routes/health.routes.ts`

```typescript
router.get('/health/geocoding', async (req, res) => {
  const geocodingService = new GeocodingService();

  // Test geocoding with a known address
  const testAddress = {
    street: '1600 Pennsylvania Avenue NW',
    city: 'Washington',
    state: 'DC',
    zip: '20500'
  };

  try {
    const result = await geocodingService.geocodeAddress(testAddress);

    if (result) {
      res.json({
        status: 'healthy',
        provider: 'mapbox',
        test_result: result
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Geocoding test failed'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 7. Add Environment Variables

```.env
# Geocoding API
GEOCODING_PROVIDER=mapbox  # google, mapbox, nominatim
GEOCODING_API_KEY=your_api_key_here
```

## Acceptance Criteria

- [ ] Geocoding service implemented
- [ ] Auto-geocode on client create/update
- [ ] Database schema updated
- [ ] Migration for existing clients
- [ ] Manual geocode button in UI
- [ ] Geocoding status displayed
- [ ] Health check endpoint
- [ ] Rate limiting for API calls
- [ ] Error handling for failed geocodes
- [ ] Tests for geocoding service
- [ ] Documentation for setup

## Testing Checklist

1. **Auto-Geocoding**:
   - Create new client → Address auto-geocoded
   - Update client address → Re-geocoded automatically
2. **Manual Geocoding**:
   - Click manual geocode button → Coordinates populated
3. **Failed Geocoding**:
   - Invalid address → Marked as failed, doesn't block client creation
4. **Bulk Geocoding**:
   - Run script → Existing clients geocoded
5. **API Providers**:
   - Test with Google Maps API
   - Test with Mapbox API
   - Test with Nominatim

## Definition of Done

- ✅ All new client addresses auto-geocoded
- ✅ Existing clients can be batch geocoded
- ✅ Manual geocode option available
- ✅ Geocoding status visible in UI
- ✅ Graceful failure handling
- ✅ Tests passing
- ✅ API key configured

## Dependencies

**Blocks**: Tasks 0000 (EVV), 0001 (Scheduling)
**Depends on**: None

## Priority Justification

This is **CRITICAL** because:
1. Required for GPS-based EVV compliance
2. Required for route optimization
3. Blocks scheduling features
4. Poor UX without it
5. Fast fix (4-5 hours) with high impact

---

**Next Task**: 0026 - Care Plan Templates
