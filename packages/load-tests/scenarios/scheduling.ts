import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';
import { Counter, Trend } from 'k6/metrics';

// Custom metrics
const visitCreations = new Counter('visit_creations');
const visitRetrievals = new Trend('visit_retrieval_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],
    'visit_retrieval_time': ['p(95)<500'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';

  // Login as coordinator
  const auth = login('coordinator@test.care-commons.local', 'TestPassword123!');
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Get list of clients
  const clientsRes = http.get(`${baseUrl}/api/clients?limit=10`, { headers });
  check(clientsRes, {
    'clients retrieved': (r) => r.status === 200,
    'has clients': (r) => {
      const data = r.json('data');
      return data !== undefined && Array.isArray(data) && data.length > 0;
    },
  });

  sleep(1);

  // Get list of caregivers
  const caregiversRes = http.get(`${baseUrl}/api/caregivers?limit=10`, { headers });
  check(caregiversRes, {
    'caregivers retrieved': (r) => r.status === 200,
    'has caregivers': (r) => {
      const data = r.json('data');
      return data !== undefined && Array.isArray(data) && data.length > 0;
    },
  });

  sleep(1);

  // Get today's visits
  const visitsStartTime = Date.now();
  const visitsRes = http.get(`${baseUrl}/api/visits?date=today`, { headers });
  const visitsEndTime = Date.now();

  visitRetrievals.add(visitsEndTime - visitsStartTime);

  check(visitsRes, {
    'visits retrieved': (r) => r.status === 200,
  });

  sleep(2);

  // Create a visit (10% of the time)
  if (Math.random() < 0.1) {
    const clients = clientsRes.json('data');
    const caregivers = caregiversRes.json('data');

    if (clients && caregivers && Array.isArray(clients) && Array.isArray(caregivers) && clients.length > 0 && caregivers.length > 0) {
      const visit = {
        client_id: clients[0].id,
        caregiver_id: caregivers[0].id,
        scheduled_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
        service_type: 'personal_care',
      };

      const createRes = http.post(
        `${baseUrl}/api/visits`,
        JSON.stringify(visit),
        { headers }
      );

      check(createRes, {
        'visit created': (r) => r.status === 201,
      });

      if (createRes.status === 201) {
        visitCreations.add(1);
      }
    }
  }

  sleep(2);
}
