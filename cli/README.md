# Cap demo

This cli demonstrates the authentication and authorization code flow for the perseus trust framework.

## Certificate setup

You will need to generate a key pair and a certificate for the mtls connections using the UI at the ib1 directory. Visit [the members area](https://directory.core.pilot.trust.ib1.org/members/) for more information.

- Generate a certificate at the ib1 directory and download
- Download the CA client bundle
- Update your config.ts file to match the paths to the certificates

```typescript
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
```

You may also need to update the redirectUri if you change the port or domain of the callback server.

## Install dependencies

```bash
npm install
```

## Run the callback server

```bash
npm run start
<complete login in using a browser>
```

## Initiate authorization code flow

```bash
npm run get_code
<complete login in using a browser>
```

## Useful openssl commands

Check your certificate

```bash
openssl x509 -in ./certs/Local-development.pem -text -noout
```

Verify CA

```bash
openssl verify -CAfile ./certs/directory-client-certificates/bundle.pem ./certs/Local-development.pem
```

## Test connection

```bash
curl -v --cert ./certs/local-development-bundle.pem --key ./certs/local-development-key.pem --cacert ./certs/directory-client-certificates/root-ca.pem https://preprod.perseus-demo-authentication.ib1.org
```
