import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';

export const options = {
  vus: 20,
  duration: '2m',
  thresholds: {
    'http_req_duration{endpoint:clock_in}': ['p(95)<800'],
    'http_req_duration{endpoint:clock_out}': ['p(95)<800'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Login as caregiver
  const auth = login('caregiver@test.care-commons.local', 'TestPassword123!');
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Get today's visits
  const visitsRes = http.get(`${baseUrl}/api/visits/my-visits?date=today`, { headers });
  check(visitsRes, {
    'visits retrieved': (r) => r.status === 200,
  });

  const visits = visitsRes.json('data');
  if (!visits || !Array.isArray(visits) || visits.length === 0) return;

  const visit = visits[0];

  sleep(1);

  // Clock in
  const clockInPayload = {
    visit_id: visit.id,
    latitude: 30.2672,
    longitude: -97.7431,
    device_id: `test-device-${__VU}`,
  };

  const clockInRes = http.post(
    `${baseUrl}/api/evv/clock-in`,
    JSON.stringify(clockInPayload),
    {
      headers,
      tags: { endpoint: 'clock_in' }
    }
  );

  check(clockInRes, {
    'clock in successful': (r) => r.status === 200 || r.status === 201,
    'evv record created': (r) => r.json('id') !== undefined,
  });

  sleep(5); // Simulate 5 seconds of work

  // Clock out
  const clockOutPayload = {
    visit_id: visit.id,
    latitude: 30.2672,
    longitude: -97.7431,
    device_id: `test-device-${__VU}`,
    notes: 'Provided excellent care',
  };

  const clockOutRes = http.post(
    `${baseUrl}/api/evv/clock-out`,
    JSON.stringify(clockOutPayload),
    {
      headers,
      tags: { endpoint: 'clock_out' }
    }
  );

  check(clockOutRes, {
    'clock out successful': (r) => r.status === 200,
    'evv validated': (r) => r.json('compliance_status') !== undefined,
  });

  sleep(2);
}
