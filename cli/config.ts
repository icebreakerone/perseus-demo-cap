export const config = {
  publicServer: new URL(
    process.env.CLI_PUBLIC_SERVER ??
      'https://preprod.mtls.perseus-demo-authentication.ib1.org', //'https://localhost:8000'
  ),
  clientId:
    process.env.CLI_CLIENT_ID ??
    'https://directory.core.sandbox.trust.ib1.org/a/s2914npr',
  redirectUri: process.env.CLI_REDIRECT_URI ?? 'http://localhost:3000/callback',
  postLoginRedirect:
    process.env.CLI_POST_LOGIN_REDIRECT ?? 'http://localhost:3000/callback',
  mtlsBundlePath:
    process.env.CLI_MTLS_BUNDLE_PATH ??
    '../certs/cap-demo-certs/cap-demo-bundle.pem',
  mtlsKeyPath:
    process.env.CLI_MTLS_KEY_PATH ?? '../certs/cap-demo-certs/cap-demo-key.pem',
  serverCaPath: process.env.CLI_SERVER_CA_PATH,
  skipServerVerification:
    process.env.CLI_SKIP_SERVER_VERIFICATION === 'true' || '1' || 'yes',
  protectedResourceUrl: new URL(
    process.env.CLI_PROTECTED_RESOURCE_URL ??
      'https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/', //'https://localhost:8010/datasources/'
  ),
  provenanceServiceUrl: new URL(
    process.env.CLI_PROVENANCE_SERVICE_URL ?? 'http://localhost:8081',
  ),
}
