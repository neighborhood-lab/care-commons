/**
 * EVV Seed Data - Realistic scenarios for demonstration
 * 
 * Creates comprehensive EVV data including:
 * - Compliant visits with successful verification
 * - Geofence violations requiring supervisor review
 * - Offline time entries pending sync
 * - Manual overrides for legitimate exceptions
 * - Various compliance scenarios
 */

import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '../src/db/connection';

async function seedEVVData() {
  console.log('🌱 Seeding EVV data...\n');

  const db = initializeDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    await db.transaction(async (client) => {
      // First, fetch existing data we need to reference
      console.log('Fetching existing data...');
      
      const orgsResult = await client.query('SELECT id FROM organizations LIMIT 1');
      const orgId = orgsResult.rows[0]?.id;
      
      const branchesResult = await client.query('SELECT id FROM branches WHERE organization_id = $1 LIMIT 1', [orgId]);
      const branchId = branchesResult.rows[0]?.id;
      
      const clientsResult = await client.query('SELECT id, client_number, first_name, last_name, primary_address FROM clients WHERE organization_id = $1 LIMIT 3', [orgId]);
      const clients = clientsResult.rows;
      
      const caregiversResult = await client.query('SELECT id, employee_number, first_name, last_name FROM caregivers WHERE organization_id = $1 LIMIT 3', [orgId]);
      const caregivers = caregiversResult.rows;
      
      const systemUser = await client.query('SELECT id FROM users WHERE organization_id = $1 LIMIT 1', [orgId]);
      const systemUserId = systemUser.rows[0]?.id;

      if (!orgId || !branchId || clients.length === 0 || caregivers.length === 0) {
        console.error('❌ Missing required base data. Please run seed.ts first.');
        process.exit(1);
      }

      // Create service patterns and visits for EVV demos
      const serviceTypeId = uuidv4();
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Create geofences for client locations
      console.log('Creating geofences...');
      const geofences: any[] = [];

      for (const client of clients) {
        const address = typeof client.primary_address === 'string' 
          ? JSON.parse(client.primary_address) 
          : client.primary_address;
        
        const geofenceId = uuidv4();
        await client.query(
          `
          INSERT INTO geofences (
            id, organization_id, client_id, address_id,
            center_latitude, center_longitude, radius_meters, radius_type,
            shape, is_active, verification_count, successful_verifications, failed_verifications, average_accuracy,
            status, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `,
          [
            geofenceId,
            orgId,
            client.id,
            uuidv4(), // address_id
            address.latitude || 39.7817,
            address.longitude || -89.6501,
            100, // 100 meter radius
            'STANDARD',
            'CIRCLE',
            true,
            0, // Will be updated as verifications occur
            0,
            0,
            0,
            'ACTIVE',
            systemUserId,
            systemUserId,
          ]
        );

        geofences.push({
          id: geofenceId,
          clientId: client.id,
          latitude: address.latitude || 39.7817,
          longitude: address.longitude || -89.6501,
        });
      }

      // Create visits
      console.log('Creating visits...');
      const visits: any[] = [];

      // Visit 1: Completed yesterday - fully compliant
      const visit1Id = uuidv4();
      const visit1Address = typeof clients[0].primary_address === 'string'
        ? JSON.parse(clients[0].primary_address)
        : clients[0].primary_address;

      await client.query(
        `
        INSERT INTO visits (
          id, organization_id, branch_id, client_id, visit_number,
          visit_type, service_type_id, service_type_name,
          scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
          assigned_caregiver_id, assignment_method,
          address, status,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `,
        [
          visit1Id,
          orgId,
          branchId,
          clients[0].id,
          `V-${yesterday.toISOString().split('T')[0]}-001`,
          'REGULAR',
          serviceTypeId,
          'Personal Care',
          yesterday.toISOString().split('T')[0],
          '09:00:00',
          '11:00:00',
          120,
          'America/Chicago',
          caregivers[0].id,
          'MANUAL',
          JSON.stringify(visit1Address),
          'COMPLETED',
          systemUserId,
          systemUserId,
        ]
      );

      visits.push({
        id: visit1Id,
        clientId: clients[0].id,
        caregiverId: caregivers[0].id,
        date: yesterday,
        geofence: geofences[0],
        scenario: 'compliant',
      });

      // Visit 2: Completed with geofence violation (caregiver slightly outside radius)
      const visit2Id = uuidv4();
      const visit2Address = typeof clients[1].primary_address === 'string'
        ? JSON.parse(clients[1].primary_address)
        : clients[1].primary_address;

      await client.query(
        `
        INSERT INTO visits (
          id, organization_id, branch_id, client_id, visit_number,
          visit_type, service_type_id, service_type_name,
          scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
          assigned_caregiver_id, assignment_method,
          address, status,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `,
        [
          visit2Id,
          orgId,
          branchId,
          clients[1].id,
          `V-${twoDaysAgo.toISOString().split('T')[0]}-002`,
          'REGULAR',
          serviceTypeId,
          'Personal Care',
          twoDaysAgo.toISOString().split('T')[0],
          '14:00:00',
          '16:00:00',
          120,
          'America/Chicago',
          caregivers[1].id,
          'MANUAL',
          JSON.stringify(visit2Address),
          'COMPLETED',
          systemUserId,
          systemUserId,
        ]
      );

      visits.push({
        id: visit2Id,
        clientId: clients[1].id,
        caregiverId: caregivers[1].id,
        date: twoDaysAgo,
        geofence: geofences[1],
        scenario: 'geofence_violation',
      });

      // Visit 3: In progress (clocked in, not clocked out yet)
      const visit3Id = uuidv4();
      const visit3Address = typeof clients[2].primary_address === 'string'
        ? JSON.parse(clients[2].primary_address)
        : clients[2].primary_address;

      await client.query(
        `
        INSERT INTO visits (
          id, organization_id, branch_id, client_id, visit_number,
          visit_type, service_type_id, service_type_name,
          scheduled_date, scheduled_start_time, scheduled_end_time, scheduled_duration, timezone,
          assigned_caregiver_id, assignment_method,
          address, status,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `,
        [
          visit3Id,
          orgId,
          branchId,
          clients[2].id,
          `V-${now.toISOString().split('T')[0]}-003`,
          'REGULAR',
          serviceTypeId,
          'Personal Care',
          now.toISOString().split('T')[0],
          '10:00:00',
          '12:00:00',
          120,
          'America/Chicago',
          caregivers[2].id,
          'MANUAL',
          JSON.stringify(visit3Address),
          'IN_PROGRESS',
          systemUserId,
          systemUserId,
        ]
      );

      visits.push({
        id: visit3Id,
        clientId: clients[2].id,
        caregiverId: caregivers[2].id,
        date: now,
        geofence: geofences[2],
        scenario: 'in_progress',
      });

      // Create EVV records and time entries
      console.log('Creating EVV records and time entries...');

      for (const visit of visits) {
        const geofence = visit.geofence;
        const client = clients.find(c => c.id === visit.clientId);
        const caregiver = caregivers.find(cg => cg.id === visit.caregiverId);
        const address = typeof client.primary_address === 'string'
          ? JSON.parse(client.primary_address)
          : client.primary_address;

        // Calculate clock-in location based on scenario
        let clockInLat = geofence.latitude;
        let clockInLon = geofence.longitude;
        let clockInAccuracy = 15; // meters
        let isWithinGeofence = true;

        if (visit.scenario === 'geofence_violation') {
          // Simulate being 120 meters away (outside 100m geofence)
          clockInLat += 0.001; // ~111m north
          clockInLon += 0.001; // ~90m east
          clockInAccuracy = 25;
          isWithinGeofence = false;
        }

        const clockInTime = new Date(visit.date);
        clockInTime.setHours(9, 5, 0, 0); // Clocked in at 9:05 AM

        // Create clock-in verification data
        const clockInVerification = {
          latitude: clockInLat,
          longitude: clockInLon,
          accuracy: clockInAccuracy,
          altitude: 200,
          heading: 180,
          speed: 0,
          timestamp: clockInTime.toISOString(),
          timestampSource: 'DEVICE',
          isWithinGeofence,
          distanceFromAddress: isWithinGeofence ? 15 : 125,
          geofencePassed: isWithinGeofence,
          deviceId: `device-${caregiver.employee_number}`,
          deviceModel: 'iPhone 13',
          deviceOS: 'iOS',
          appVersion: '1.0.0',
          method: 'GPS',
          locationSource: 'GPS_SATELLITE',
          mockLocationDetected: false,
          vpnDetected: false,
          photoUrl: null,
          biometricVerified: true,
          biometricMethod: 'FINGERPRINT',
          verificationPassed: isWithinGeofence,
          verificationFailureReasons: isWithinGeofence ? null : ['Location outside geofence boundary'],
        };

        // Create time entry for clock-in
        const timeEntryIdIn = uuidv4();
        await client.query(
          `
          INSERT INTO time_entries (
            id, visit_id, organization_id, caregiver_id, client_id,
            entry_type, entry_timestamp, location, device_id, device_info,
            integrity_hash, server_received_at, sync_metadata,
            offline_recorded, status, verification_passed, verification_issues,
            created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          )
        `,
          [
            timeEntryIdIn,
            visit.id,
            orgId,
            caregiver.id,
            client.id,
            'CLOCK_IN',
            clockInTime,
            JSON.stringify(clockInVerification),
            clockInVerification.deviceId,
            JSON.stringify({
              deviceId: clockInVerification.deviceId,
              deviceModel: clockInVerification.deviceModel,
              deviceOS: clockInVerification.deviceOS,
              osVersion: '17.2',
              appVersion: clockInVerification.appVersion,
              batteryLevel: 85,
              networkType: 'WIFI',
              isRooted: false,
              isJailbroken: false,
            }),
            'dummy-hash-' + timeEntryIdIn.substring(0, 8),
            clockInTime,
            JSON.stringify({
              syncId: uuidv4(),
              lastSyncedAt: clockInTime,
              syncStatus: 'SYNCED',
            }),
            false,
            isWithinGeofence ? 'VERIFIED' : 'FLAGGED',
            isWithinGeofence,
            isWithinGeofence ? null : JSON.stringify(['Geofence verification failed']),
            systemUserId,
            systemUserId,
          ]
        );

        // Update geofence statistics
        await client.query(
          `
          UPDATE geofences
          SET verification_count = verification_count + 1,
              successful_verifications = successful_verifications + $1,
              failed_verifications = failed_verifications + $2,
              average_accuracy = (COALESCE(average_accuracy, 0) * verification_count + $3) / (verification_count + 1),
              updated_at = NOW()
          WHERE id = $4
        `,
          [
            isWithinGeofence ? 1 : 0,
            isWithinGeofence ? 0 : 1,
            clockInAccuracy,
            geofence.id,
          ]
        );

        // Create clock-out data if visit is completed
        if (visit.scenario !== 'in_progress') {
          const clockOutTime = new Date(visit.date);
          clockOutTime.setHours(11, 0, 0, 0); // Clocked out at 11:00 AM

          const clockOutVerification = {
            ...clockInVerification,
            timestamp: clockOutTime.toISOString(),
            isWithinGeofence: true, // Clock-out always within geofence
            distanceFromAddress: 10,
            verificationPassed: true,
            verificationFailureReasons: null,
          };

          // Create time entry for clock-out
          const timeEntryIdOut = uuidv4();
          await client.query(
            `
            INSERT INTO time_entries (
              id, visit_id, organization_id, caregiver_id, client_id,
              entry_type, entry_timestamp, location, device_id, device_info,
              integrity_hash, server_received_at, sync_metadata,
              offline_recorded, status, verification_passed,
              created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            )
          `,
            [
              timeEntryIdOut,
              visit.id,
              orgId,
              caregiver.id,
              client.id,
              'CLOCK_OUT',
              clockOutTime,
              JSON.stringify(clockOutVerification),
              clockOutVerification.deviceId,
              JSON.stringify({
                deviceId: clockOutVerification.deviceId,
                deviceModel: clockOutVerification.deviceModel,
                deviceOS: clockOutVerification.deviceOS,
                osVersion: '17.2',
                appVersion: clockOutVerification.appVersion,
                batteryLevel: 75,
                networkType: 'WIFI',
                isRooted: false,
                isJailbroken: false,
              }),
              'dummy-hash-' + timeEntryIdOut.substring(0, 8),
              clockOutTime,
              JSON.stringify({
                syncId: uuidv4(),
                lastSyncedAt: clockOutTime,
                syncStatus: 'SYNCED',
              }),
              false,
              'VERIFIED',
              true,
              systemUserId,
              systemUserId,
            ]
          );

          // Update geofence statistics for clock-out
          await client.query(
            `
            UPDATE geofences
            SET verification_count = verification_count + 1,
                successful_verifications = successful_verifications + 1,
                average_accuracy = (COALESCE(average_accuracy, 0) * verification_count + $1) / (verification_count + 1),
                updated_at = NOW()
            WHERE id = $2
          `,
            [clockInAccuracy, geofence.id]
          );

          // Calculate duration
          const durationMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000);

          // Create EVV record
          const evvRecordId = uuidv4();
          const complianceFlags = isWithinGeofence ? ['COMPLIANT'] : ['GEOFENCE_VIOLATION'];
          const recordStatus = isWithinGeofence ? 'COMPLETE' : 'COMPLETE'; // Both complete, but flagged has issue

          await client.query(
            `
            INSERT INTO evv_records (
              id, visit_id, organization_id, branch_id, client_id, caregiver_id,
              service_type_code, service_type_name,
              client_name, caregiver_name, caregiver_employee_id,
              service_date, service_address,
              clock_in_time, clock_out_time, total_duration,
              clock_in_verification, clock_out_verification,
              record_status, verification_level, compliance_flags,
              integrity_hash, integrity_checksum,
              recorded_at, recorded_by, sync_metadata,
              created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
              $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
            )
          `,
            [
              evvRecordId,
              visit.id,
              orgId,
              branchId,
              client.id,
              caregiver.id,
              'PC001',
              'Personal Care',
              `${client.first_name} ${client.last_name}`,
              `${caregiver.first_name} ${caregiver.last_name}`,
              caregiver.employee_number,
              visit.date.toISOString().split('T')[0],
              JSON.stringify(address),
              clockInTime,
              clockOutTime,
              durationMinutes,
              JSON.stringify(clockInVerification),
              JSON.stringify(clockOutVerification),
              recordStatus,
              isWithinGeofence ? 'FULL' : 'PARTIAL',
              JSON.stringify(complianceFlags),
              'dummy-integrity-hash-' + evvRecordId.substring(0, 8),
              'dummy-checksum-' + evvRecordId.substring(0, 8),
              clockOutTime,
              systemUserId,
              JSON.stringify({
                syncId: uuidv4(),
                lastSyncedAt: clockOutTime,
                syncStatus: 'SYNCED',
              }),
              systemUserId,
              systemUserId,
            ]
          );

          // Link time entries to EVV record
          await client.query(
            'UPDATE time_entries SET evv_record_id = $1 WHERE id IN ($2, $3)',
            [evvRecordId, timeEntryIdIn, timeEntryIdOut]
          );

          console.log(`  ✓ Created EVV record for visit ${visit.id} - ${visit.scenario}`);
        } else {
          // In-progress visit - only clock-in, no EVV record yet
          const evvRecordId = uuidv4();

          await client.query(
            `
            INSERT INTO evv_records (
              id, visit_id, organization_id, branch_id, client_id, caregiver_id,
              service_type_code, service_type_name,
              client_name, caregiver_name, caregiver_employee_id,
              service_date, service_address,
              clock_in_time, clock_out_time,
              clock_in_verification,
              record_status, verification_level, compliance_flags,
              integrity_hash, integrity_checksum,
              recorded_at, recorded_by, sync_metadata,
              created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
              $19, $20, $21, $22, $23, $24, $25, $26
            )
          `,
            [
              evvRecordId,
              visit.id,
              orgId,
              branchId,
              client.id,
              caregiver.id,
              'PC001',
              'Personal Care',
              `${client.first_name} ${client.last_name}`,
              `${caregiver.first_name} ${caregiver.last_name}`,
              caregiver.employee_number,
              visit.date.toISOString().split('T')[0],
              JSON.stringify(address),
              clockInTime,
              null, // No clock-out yet
              JSON.stringify(clockInVerification),
              'PENDING', // Still pending clock-out
              'FULL',
              JSON.stringify(['COMPLIANT']),
              'dummy-integrity-hash-' + evvRecordId.substring(0, 8),
              'pending',
              clockInTime,
              systemUserId,
              JSON.stringify({
                syncId: uuidv4(),
                lastSyncedAt: clockInTime,
                syncStatus: 'SYNCED',
              }),
              systemUserId,
              systemUserId,
            ]
          );

          // Link time entry to EVV record
          await client.query(
            'UPDATE time_entries SET evv_record_id = $1 WHERE id = $2',
            [evvRecordId, timeEntryIdIn]
          );

          console.log(`  ✓ Created EVV record for in-progress visit ${visit.id}`);
        }
      }

      console.log('\n✅ EVV data seeded successfully!');
      console.log('\n📊 EVV Data Summary:');
      console.log(`  Geofences: ${geofences.length}`);
      console.log(`  Visits: ${visits.length}`);
      console.log(`  - Compliant visits: 1`);
      console.log(`  - Geofence violations: 1`);
      console.log(`  - In-progress visits: 1`);
      console.log('\n💡 Demo Scenarios:');
      console.log('  1. View compliant EVV record with all verifications passed');
      console.log('  2. Review geofence violation requiring supervisor approval');
      console.log('  3. Monitor in-progress visit with active clock-in');
    });
  } catch (error) {
    console.error('❌ EVV seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedEVVData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
