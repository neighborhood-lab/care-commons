import { check, sleep } from 'k6';
import http from 'k6/http';
import { login } from '../utils/auth';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate must be below 1%
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Test login
  const authRes = login('coordinator@test.care-commons.local', 'TestPassword123!');

  check(authRes, {
    'login returned token': (auth) => auth !== null && auth.token.length > 0,
  });

  sleep(1);

  // Test token refresh
  if (authRes) {
    const refreshRes = http.post(
      `${baseUrl}/api/auth/refresh`,
      JSON.stringify({ refreshToken: authRes.refreshToken }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    check(refreshRes, {
      'refresh successful': (r) => r.status === 200,
      'new token received': (r) => r.json('token') !== undefined,
    });
  }

  sleep(1);
}
