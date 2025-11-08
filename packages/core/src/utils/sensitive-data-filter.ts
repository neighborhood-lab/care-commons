// Filter sensitive data from logs
export class SensitiveDataFilter {
  private static SENSITIVE_FIELDS = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'cvv',
    'pin',
    'biometric',
  ];

  static filter(data: any): any {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filter(item));
    }

    if (data && typeof data === 'object') {
      const filtered: any = {};
      for (const key in data) {
        if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          filtered[key] = '[REDACTED]';
        } else {
          filtered[key] = this.filter(data[key]);
        }
      }
      return filtered;
    }

    return data;
  }
}
