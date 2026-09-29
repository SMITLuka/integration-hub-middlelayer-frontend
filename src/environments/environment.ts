/**
 * Production environment configuration.
 * The browser calls the backend directly, so this must be its public HTTPS URL
 * (an HTTP URL would be blocked as mixed content on the HTTPS-hosted frontend).
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://oebq1ihnddzfc11litrx2chr.128.140.44.96.sslip.io',
  // Bitrix MCP server acting as OpenID Connect provider: users log in with their Bitrix24 account.
  authIssuer: 'https://mcp.sm-it.hr',
  authClientId: 'integration-hub',
};
