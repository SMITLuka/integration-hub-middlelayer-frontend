/**
 * Development environment configuration.
 * Empty base URL: `ng serve --proxy-config proxy.conf.json` forwards API calls to
 * http://localhost:8080, so relative URLs are used throughout the app.
 */
export const environment = {
  production: false,
  apiBaseUrl: '',
  // SMIT SSO portal: users open Integration Hub from there; ssoAppKey is this app's key in the portal.
  ssoUrl: 'https://backend-production-5810.up.railway.app',
  ssoAppKey: 'integration-hub-aef58444',
};
