import { check, sleep } from 'k6';
import http from 'k6/http';
import { login, getAuthHeaders } from '../utils/auth';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Baseline
    { duration: '10s', target: 100 },  // SPIKE!
    { duration: '30s', target: 100 },  // Sustain spike
    { duration: '10s', target: 5 },    // Recovery
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // More lenient during spike
    'http_req_failed': ['rate<0.1'],     // Allow 10% errors during spike
  },
};

const USER_ROLES = [
  { email: 'admin@test.care-commons.local', password: 'TestPassword123!', weight: 0.1 },
  { email: 'coordinator@test.care-commons.local', password: 'TestPassword123!', weight: 0.3 },
  { email: 'caregiver@test.care-commons.local', password: 'TestPassword123!', weight: 0.5 },
  { email: 'family@test.care-commons.local', password: 'TestPassword123!', weight: 0.1 },
];

function getRandomUser() {
  const rand = Math.random();
  let cumulative = 0;

  for (const user of USER_ROLES) {
    cumulative += user.weight;
    if (rand < cumulative) return user;
  }

  return USER_ROLES[0];
}

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const user = getRandomUser();

  // Login
  const auth = login(user.email, user.password);
  if (!auth) return;

  const headers = getAuthHeaders(auth.token);

  // Simulate realistic user behavior based on role
  if (user.email.includes('coordinator')) {
    coordinatorWorkflow(baseUrl, headers);
  } else if (user.email.includes('caregiver')) {
    caregiverWorkflow(baseUrl, headers);
  } else if (user.email.includes('family')) {
    familyWorkflow(baseUrl, headers);
  } else {
    adminWorkflow(baseUrl, headers);
  }

  sleep(randomIntBetween(1, 5));
}

function coordinatorWorkflow(baseUrl: string, headers: object) {
  // View dashboard
  http.get(`${baseUrl}/api/dashboard/coordinator`, { headers });
  sleep(2);

  // View today's visits
  http.get(`${baseUrl}/api/visits?date=today`, { headers });
  sleep(1);

  // View clients
  http.get(`${baseUrl}/api/clients?limit=20`, { headers });
  sleep(1);

  // View caregivers
  http.get(`${baseUrl}/api/caregivers?limit=20`, { headers });
  sleep(1);
}

function caregiverWorkflow(baseUrl: string, headers: object) {
  // View my visits
  http.get(`${baseUrl}/api/visits/my-visits?date=today`, { headers });
  sleep(2);

  // View care plans
  http.get(`${baseUrl}/api/care-plans/assigned`, { headers });
  sleep(1);
}

function familyWorkflow(baseUrl: string, headers: object) {
  // View family portal dashboard
  http.get(`${baseUrl}/api/family-portal/dashboard`, { headers });
  sleep(2);

  // View recent visits
  http.get(`${baseUrl}/api/family-portal/visits`, { headers });
  sleep(1);

  // View messages
  http.get(`${baseUrl}/api/family-portal/messages`, { headers });
  sleep(1);
}

function adminWorkflow(baseUrl: string, headers: object) {
  // View admin dashboard
  http.get(`${baseUrl}/api/dashboard/admin`, { headers });
  sleep(2);

  // View analytics
  http.get(`${baseUrl}/api/analytics/overview`, { headers });
  sleep(1);
}
