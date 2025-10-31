import { v4 as uuidv4 } from 'uuid';
import { Database } from '../src/db/connection';

export async function seedEVVStateSpecific(db: Database) {
  const orgId = uuidv4();
  const systemUserId = uuidv4();

  // TX EVV Configuration
  await db.query(`
    INSERT INTO evv_state_config (
      id, organization_id, state_code, medicaid_program, evv_aggregator,
      clock_methods_allowed, geofence_tolerance_meters, grace_period_minutes,
      config_data, created_by, updated_by
    ) VALUES (
      $1, $2, 'TX', 'STAR_PLUS', 'HHAEEXCHANGE',
      ARRAY['GPS', 'TELEPHONY'], 100, 10,
      $3::jsonb, $4, $4
    )
  `, [
    uuidv4(), orgId,
    JSON.stringify({
      vmur_enabled: true,
      vmur_expiration_days: 30,
      requires_medicaid_id: true,
      api_endpoint: 'https://api.hhaeexchange.com/v2'
    }),
    systemUserId
  ]);

  // FL EVV Configuration
  await db.query(`
    INSERT INTO evv_state_config (
      id, organization_id, state_code, medicaid_program, evv_aggregator,
      clock_methods_allowed, geofence_tolerance_meters, grace_period_minutes,
      config_data, created_by, updated_by
    ) VALUES (
      $1, $2, 'FL', 'SMMC_LTC', 'HHAEEXCHANGE',
      ARRAY['GPS', 'TELEPHONY', 'NETWORK'], 150, 15,
      $3::jsonb, $4, $4
    )
  `, [
    uuidv4(), orgId,
    JSON.stringify({
      multi_aggregator: true,
      aggregators: ['HHAEEXCHANGE', 'NETSMART_TELLUS'],
      route_by_mco: true
    }),
    systemUserId
  ]);

  console.log('✅ TX/FL EVV configuration seed complete');
}