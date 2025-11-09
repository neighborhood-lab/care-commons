import sql from 'k6/x/sql';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '5m',
};

const db = sql.open(
  'postgres',
  `postgres://${__ENV.DB_USER}:${__ENV.DB_PASSWORD}@${__ENV.DB_HOST}:${__ENV.DB_PORT}/${__ENV.DB_NAME}`
);

export default function () {
  // Test concurrent reads
  const result = db.query('SELECT * FROM clients LIMIT 100');
  check(result, {
    'query successful': (r) => r.length > 0,
  });

  // Test writes
  const insertResult = db.exec(
    `INSERT INTO visits (client_id, caregiver_id, scheduled_start, scheduled_end, status)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour', 'scheduled')`,
    'client-123',
    'caregiver-456'
  );

  check(insertResult, {
    'insert successful': (r) => r.rowsAffected === 1,
  });
}

export function teardown() {
  db.close();
}
