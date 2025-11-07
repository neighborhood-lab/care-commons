#!/usr/bin/env tsx
/**
 * Batch geocoding script for existing clients
 *
 * Usage: tsx scripts/geocode-clients.ts
 *
 * This script will:
 * 1. Find all clients without coordinates
 * 2. Geocode their addresses
 * 3. Update the database with coordinates
 * 4. Rate limit API calls to avoid throttling
 */

import { getDb } from '../packages/core/src/db/connection.js';
import { GeocodingService } from '../packages/core/src/service/geocoding.service.js';
import type { Address } from '../packages/core/src/types/index.js';

interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  primary_address: Address;
}

async function geocodeExistingClients() {
  const db = getDb();
  const provider = (process.env.GEOCODING_PROVIDER || 'mapbox') as 'google' | 'mapbox' | 'nominatim';
  const geocodingService = new GeocodingService(provider);

  console.log(`Using geocoding provider: ${provider}`);
  console.log('Starting batch geocoding process...\n');

  try {
    // Find clients without coordinates
    const clients = await db<ClientRow>('clients')
      .select('id', 'first_name', 'last_name', 'primary_address')
      .whereNull('coordinates')
      .whereNotNull('primary_address')
      .where('geocoding_failed', false)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    console.log(`Found ${clients.length} clients to geocode\n`);

    if (clients.length === 0) {
      console.log('No clients need geocoding. Exiting.');
      await db.destroy();
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const client of clients) {
      try {
        console.log(`Geocoding: ${client.first_name} ${client.last_name} - ${client.primary_address.line1}`);

        // Skip if address is incomplete
        if (!client.primary_address.line1 || !client.primary_address.city || !client.primary_address.state) {
          console.log(`  ⊘ Skipped: Incomplete address`);
          skipCount++;
          continue;
        }

        const result = await geocodingService.geocodeAddress(client.primary_address);

        if (result) {
          await db('clients')
            .where({ id: client.id })
            .update({
              coordinates: JSON.stringify({ lat: result.latitude, lng: result.longitude }),
              geocoding_confidence: result.confidence,
              geocoded_at: new Date(),
              geocoding_failed: false,
              updated_at: new Date()
            });

          successCount++;
          console.log(`  ✓ Success: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)} (${result.confidence})`);
        } else {
          await db('clients')
            .where({ id: client.id })
            .update({
              geocoding_failed: true,
              updated_at: new Date()
            });

          failCount++;
          console.log(`  ✗ Failed to geocode`);
        }

        // Rate limiting (adjust based on provider)
        // Nominatim: 1 request per second
        // Mapbox: 600 requests per minute (free tier)
        // Google: 50 requests per second (paid)
        const delayMs = provider === 'nominatim' ? 1000 : provider === 'mapbox' ? 100 : 50;
        await new Promise(resolve => setTimeout(resolve, delayMs));

      } catch (error) {
        console.error(`  ✗ Error geocoding client ${client.id}:`, error);
        failCount++;

        // Mark as failed
        try {
          await db('clients')
            .where({ id: client.id })
            .update({
              geocoding_failed: true,
              updated_at: new Date()
            });
        } catch (updateError) {
          console.error(`  ✗ Failed to mark client as failed:`, updateError);
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Geocoding complete:');
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log(`  Total: ${clients.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('Fatal error during batch geocoding:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run the script
geocodeExistingClients().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
