import http from 'k6/http';
import { check } from 'k6';

export interface AuthToken {
  token: string;
  refreshToken: string;
}

export function login(email: string, password: string): AuthToken | null {
  const url = `${__ENV.BASE_URL}/api/auth/login`;

  const payload = JSON.stringify({
    email,
    password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  if (!success) {
    console.error(`Login failed for ${email}: ${res.status}`);
    return null;
  }

  return {
    token: res.json('token') as string,
    refreshToken: res.json('refreshToken') as string,
  };
}

export function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
