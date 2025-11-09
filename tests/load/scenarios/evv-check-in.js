import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 20 },  // Morning shift starts
    { duration: '5m', target: 20 },  // Steady state
    { duration: '2m', target: 100 }, // Peak check-in time
    { duration: '5m', target: 100 }, // Sustained peak
    { duration: '2m', target: 20 },  // Return to normal
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% < 1s for EVV operations
    http_req_failed: ['rate<0.005'],    // Error rate < 0.5% (EVV is critical)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Setup: Login and get token
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'caregiver@example.com',
      password: 'TestPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return { token: JSON.parse(loginRes.body).accessToken };
}

export default function (data) {
  const visitId = `visit-${Math.floor(Math.random() * 1000)}`;

  const payload = JSON.stringify({
    visitId,
    gpsCoordinates: {
      latitude: 30.2672 + Math.random() * 0.01,
      longitude: -97.7431 + Math.random() * 0.01,
      accuracy: 10,
    },
    deviceInfo: {
      deviceId: `device-${__VU}`,
      platform: 'ios',
      osVersion: '16.0',
    },
    biometricVerified: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/evv/check-in`, payload, params);

  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'check-in successful': (r) => JSON.parse(r.body).success === true,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
