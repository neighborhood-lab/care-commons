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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static filter(data: any): any {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filter(item));
    }

    if (data !== null && data !== undefined && typeof data === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered: any = {};
      for (const key in data) {
        if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          // eslint-disable-next-line security/detect-object-injection
          filtered[key] = '[REDACTED]';
        } else {
          // eslint-disable-next-line security/detect-object-injection
          filtered[key] = this.filter(data[key]);
        }
      }
      return filtered;
    }

    return data;
  }
}
