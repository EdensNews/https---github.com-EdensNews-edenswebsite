import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client without forced auth to prevent redirects while migrating to Supabase
export const base44 = createClient({
  appId: "68ad7ff9cf8628b96fa8c1c8",
  requiresAuth: false
});
