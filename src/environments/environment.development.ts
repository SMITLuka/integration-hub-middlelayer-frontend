/**
 * Development environment configuration.
 * Empty base URL: `ng serve --proxy-config proxy.conf.json` forwards API calls to
 * http://localhost:8080, so relative URLs are used throughout the app.
 */
export const environment = {
  production: false,
  apiBaseUrl: '',
  // Bitrix MCP server acting as OpenID Connect provider: users log in with their Bitrix24 account.
  authIssuer: 'https://mcp.sm-it.hr',
  authClientId: 'integration-hub',
};
