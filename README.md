# Perseus CAP demo

A simple web application showing the perseus authentication and authorisation flow. The authorisation code flow is Fapi 2.0 compliant. Client requests are protected by mutual TLS. A [cli showing the same flow](cli/README.md) is available in the cli directory, and may be useful for members developing their own integrations.

## Next app

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Create a .env.local file in the root of the project with the following content:

```bash
SECRET_COOKIE_PASSWORD=<long-secret-string>
NEXT_PUBLIC_SERVER=https://preprod.mtls.perseus-demo-authentication.ib1.org
NEXT_PUBLIC_CLIENT_ID=<client-id>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Certificates and keys

The app requires the following certificates and keys:

- A private key belonging to the client
- A bundle containing a directory issued certificate generated from the private key and the intermediate CA certificate for the directory client issuer

All keys and certificates are in PEM format.

The client key and bundle are used for mutual TLS. 

For local development, these are local files. In production, these are stored in AWS Secrets Manager.

### Verifying Certificates and Keys

You can verify your certificates and keys using OpenSSL commands. Here are the essential checks:

#### 1. Verify Key-Certificate Match
Ensure your private key matches your certificate:

```bash
# Check if the public keys match (MD5 hashes should be identical)
openssl x509 -in your-cert.pem -pubkey -noout | openssl md5
openssl ec -in your-key.pem -pubout | openssl md5
```

#### 2. Check Certificate Details
View certificate information:

```bash
# View certificate details
openssl x509 -in your-cert.pem -text -noout

# Check certificate validity dates
openssl x509 -in your-cert.pem -dates -noout

# View certificate subject and issuer
openssl x509 -in your-cert.pem -subject -noout
openssl x509 -in your-cert.pem -issuer -noout
```

#### 3. Verify Certificate Bundle Structure
Check your bundle file contains the correct certificates:

```bash
# Count certificates in bundle
grep -c "BEGIN CERTIFICATE" your-bundle.pem

# View all certificates in bundle
openssl crl2pkcs7 -nocrl -certfile your-bundle.pem | openssl pkcs7 -print_certs -text -noout

# Check certificate chain order
openssl crl2pkcs7 -nocrl -certfile your-bundle.pem | openssl pkcs7 -print_certs -noout | grep -E "(Subject:|Issuer:)"
```

#### 4. Verify Certificate Chain
Test the complete certificate chain:

```bash
# Verify with root CA (available from the members area)
openssl verify -CAfile root-ca.pem -untrusted intermediate.pem your-cert.pem

# Verify bundle against itself
openssl verify -CAfile your-bundle.pem your-cert.pem
```

#### 5. Check Key Format and Type
Verify your private key:

```bash
# Check if key is valid (for ECDSA keys)
openssl ec -in your-key.pem -check -noout

# Check key type and curve
openssl ec -in your-key.pem -text -noout | grep -A 2 "ASN1 OID"

# For RSA keys, use:
# openssl rsa -in your-key.pem -check -noout
```

#### 6. Check endpoints with curl

```bash
 curl -v -X POST "https://preprod.mtls.perseus-demo-authentication.ib1.org/api/v1/par" \
 --cert cap-demo-cert.pem \
  --key cap-demo-key.pem \
  --cacert directory-client-certificates/bundle.pem \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "response_type=code" \
-d "redirect_uri=https://perseus-demo-accounting.ib1.org/callback" \
-d "code_challenge=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" \
-d "scope=openid profile"
```


#### 7. Common Issues and Solutions

**Key values mismatch error**: This means your private key and certificate don't match. Verify they were generated as a pair.

**Certificate chain verification failed**: Ensure your bundle contains the intermediate CA certificate that issued your client certificate.

**Wrong curve type**: Make sure both your key and certificate use the same elliptic curve (e.g., both P-256 or both P-384).

**Bundle order**: The bundle should contain certificates in order: intermediate CA first, then your client certificate.

#### 8. Uploading Certificates and Keys

The deployments require certificates stored in s3 and a key stored in SSM. scripts/create_sectrets.sh can be used to update or create those files:

```bash
cd scripts
./create_secrets.sh
```

The script expects the files to be available in:

```
certs/cap-demo-certs/cap-demo-key.pem
certs/cap-demo-certs/cap-demo-bundle.pem
```

## Using the CLI

A cli is available to test endpoints. The script get_code.ts will:

- Create a PAR
- Use the PAR to create and display an authorisation URL

Once the url has been used to authorise the request, the callback will be received by the callback server which will:

- exchange the authorisation code for a token
- use the token to retrieve data from the defined endpoint
- request the assoicated provenance record and display it in the console

### Configuration

The CLI reads its configuration from `cli/config.ts`. Every value can also be overridden via environment variables at execution time:

| Environment Variable | Description | Default |
| -------------------- | ----------- | ------- |
| `CLI_PUBLIC_SERVER` | OAuth issuer URL (non-mTLS discovery endpoint) | `https://preprod.perseus-demo-authentication.ib1.org` |
| `CLI_PROTECTED_RESOURCE_URL` | Resource URL to fetch after obtaining a token | `https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/id/measure?...` |
| `CLI_MTLS_KEY_PATH` | Path to the client private key | `../certs/cap-demo-certs/cap-demo-key.pem` |
| `CLI_MTLS_BUNDLE_PATH` | Path to the client certificate bundle (leaf + intermediate) | `../certs/cap-demo-certs/cap-demo-bundle.pem` |
| `CLI_SERVER_CA_PATH` | Optional CA bundle to trust for server verification | unset |
| `CLI_SKIP_SERVER_VERIFICATION` | If set to `true`, disables server certificate verification (useful for local self-signed certs) | `false` |
| `CLI_CLIENT_ID` / `CLI_REDIRECT_URI` | OAuth client credentials | defaults in `config.ts` |

### Running against local environments


Given local servers running on the ports below: 

```
Authentication mTLS endpoint: https://localhost:8000
Resource mTLS endpoint:       https://localhost:8010
```

To run the CLI against this environment (self-signed certificates, local ports):

```
CLI_PUBLIC_SERVER=https://localhost:8000 \
CLI_PROTECTED_RESOURCE_URL=https://localhost:8010/datasources/... \
CLI_SKIP_SERVER_VERIFICATION=true \
npm run get_code
```

Similarly for the callback server:

```
CLI_PUBLIC_SERVER=https://localhost:8000 \
CLI_PROTECTED_RESOURCE_URL=https://localhost:8010/datasources/... \
CLI_SKIP_SERVER_VERIFICATION=true \
npm run start
```

An alternative to skipping verification for self signed certificates is to supply a bundle for the self signed server certificate via CLI_SERVER_CA_PATH. 

Alternatively, to run against the demo apps:

```
CLI_PUBLIC_SERVER=https://preprod.mtls.perseus-demo-authentication.ib1.org \
CLI_PROTECTED_RESOURCE_URL=https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z \
cli get_code.ts
```

Similarly for the callback server:

```
CLI_PUBLIC_SERVER=https://preprod.mtls.perseus-demo-authentication.ib1.org \
CLI_PROTECTED_RESOURCE_URL=https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/id/measure?from=2024-12-05T00:00:00Z&to=2024-12-06T00:00:00Z \
cli npx tsx callback_server.ts
```

### Example 

The following runs the flow against preproduction (no extra flags required):

```
cd cli
npx tsx get_code.ts
```

Start the callback server in a separate terminal and complete the login through the browser when prompted:

```
cd cli
npx tsx callback_server.ts
```

