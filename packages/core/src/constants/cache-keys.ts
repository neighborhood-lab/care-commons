export const CacheKeys = {
  // User caching
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userOrganizations: (userId: string) => `user:${userId}:organizations`,

  // Organization caching
  organization: (orgId: string) => `org:${orgId}`,
  organizationSettings: (orgId: string) => `org:${orgId}:settings`,
  organizationBranches: (orgId: string) => `org:${orgId}:branches`,

  // Client caching
  client: (clientId: string) => `client:${clientId}`,
  clientWithAddress: (clientId: string) => `client:${clientId}:address`,
  clientsByOrganization: (orgId: string) => `clients:org:${orgId}`,

  // Caregiver caching
  caregiver: (caregiverId: string) => `caregiver:${caregiverId}`,
  caregiverCredentials: (caregiverId: string) => `caregiver:${caregiverId}:credentials`,
  caregiversByOrganization: (orgId: string) => `caregivers:org:${orgId}`,

  // Visit caching
  visit: (visitId: string) => `visit:${visitId}`,
  visitsByCaregiver: (caregiverId: string, date: string) =>
    `visits:caregiver:${caregiverId}:${date}`,
  visitsByClient: (clientId: string, date: string) =>
    `visits:client:${clientId}:${date}`,

  // EVV state config caching
  evvStateConfig: (orgId: string, state: string) => `evv:config:${orgId}:${state}`,

  // Shift matching caching
  shiftMatchScores: (visitId: string) => `shift:match:${visitId}`,

  // Care plan caching
  carePlan: (planId: string) => `careplan:${planId}`,
  carePlansByClient: (clientId: string) => `careplans:client:${clientId}`,

  // Reference data (rarely changes)
  serviceTypes: () => 'ref:service_types',
  taskCategories: () => 'ref:task_categories',
  stateComplianceRules: (state: string) => `ref:compliance:${state}`,

  // Pattern matchers for invalidation
  patterns: {
    user: (userId: string) => `user:${userId}*`,
    organization: (orgId: string) => `org:${orgId}*`,
    client: (clientId: string) => `client:${clientId}*`,
    caregiver: (caregiverId: string) => `caregiver:${caregiverId}*`,
    visit: (visitId: string) => `visit:${visitId}*`,
  },
};

export const CacheTTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - moderately stable data
  LONG: 3600, // 1 hour - stable data
  VERY_LONG: 86400, // 24 hours - reference data
};
