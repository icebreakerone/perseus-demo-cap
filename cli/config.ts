export const config = {
  server: new URL('https://preprod.mtls.perseus-demo-authentication.ib1.org'),
  clientId: 'f67916ce-de33-4e2f-a8e3-cbd5f6459c30',
  redirectUri: 'http://localhost:3000/callback',
  mtlsBundlePath: './certs/local-development-bundle.pem',
  mtlsKeyPath: './certs/local-development-key.pem',
  serverCaPath: './certs/directory-server-certificates/bundle.pem', // Root CA certificate
  protectedResourceUrl: new URL(
    'https://preprod.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
  ),
}
