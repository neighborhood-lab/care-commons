import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  vus: 50, // 50 virtual users
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    'http_req_duration{endpoint:list_clients}': ['p(95)<500'],
    'http_req_duration{endpoint:get_visits}': ['p(95)<600'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'coordinator@example.com',
      password: 'TestPassword123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  return { token: JSON.parse(loginRes.body).accessToken };
}

export default function (data) {
  const params = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
    tags: { endpoint: 'list_clients' },
  };

  group('Client Management', function () {
    const clientsRes = http.get(`${BASE_URL}/api/clients`, params);
    check(clientsRes, {
      'list clients status 200': (r) => r.status === 200,
    });

    if (clientsRes.status === 200) {
      const clients = JSON.parse(clientsRes.body);
      if (clients.length > 0) {
        const clientId = clients[0].id;
        const clientRes = http.get(`${BASE_URL}/api/clients/${clientId}`, {
          ...params,
          tags: { endpoint: 'get_client' },
        });
        check(clientRes, {
          'get client status 200': (r) => r.status === 200,
        });
      }
    }
  });

  group('Visit Management', function () {
    const visitsRes = http.get(`${BASE_URL}/api/visits`, {
      ...params,
      tags: { endpoint: 'get_visits' },
    });
    check(visitsRes, {
      'get visits status 200': (r) => r.status === 200,
    });
  });

  group('Care Plans', function () {
    const plansRes = http.get(`${BASE_URL}/api/care-plans`, {
      ...params,
      tags: { endpoint: 'get_care_plans' },
    });
    check(plansRes, {
      'get care plans status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
