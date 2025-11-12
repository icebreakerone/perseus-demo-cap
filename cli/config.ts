export const config = {
  publicServer: new URL(
    process.env.CLI_PUBLIC_SERVER ?? 'https://localhost:8000',
  ),
  clientId: process.env.CLI_CLIENT_ID ?? 'f67916ce-de33-4e2f-a8e3-cbd5f6459c30',
  redirectUri: process.env.CLI_REDIRECT_URI ?? 'http://localhost:3000/callback',
  postLoginRedirect:
    process.env.CLI_POST_LOGIN_REDIRECT ?? 'http://localhost:3000/callback',
  mtlsBundlePath:
    process.env.CLI_MTLS_BUNDLE_PATH ??
    '../certs/cap-demo-certs/cap-demo-bundle.pem',
  mtlsKeyPath:
    process.env.CLI_MTLS_KEY_PATH ?? '../certs/cap-demo-certs/cap-demo-key.pem',
  serverCaPath: process.env.CLI_SERVER_CA_PATH,
  skipServerVerification: process.env.CLI_SKIP_SERVER_VERIFICATION === 'true',
  protectedResourceUrl: new URL(
    process.env.CLI_PROTECTED_RESOURCE_URL ??
      'https://localhost:8010/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
  ),
}
