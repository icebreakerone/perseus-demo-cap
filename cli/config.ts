export const config = {
  server: new URL('https:localhost:8000'),
  clientId: 'f67916ce-de33-4e2f-a8e3-cbd5f6459c30',
  redirectUri: 'http://localhost:3000/callback',
  mtlsBundlePath: './certs/client/cap-demo-client-bundle.pem', // client certificate
  mtlsKeyPath: './certs/client/cap-demo-client-key.pem', // client private key
  serverCaPath: './certs/client/server-bundle.pem', // intermediate and root for verification
  protectedResourceUrl: new URL(
    'https:localhost:8010/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z',
  ),
}
