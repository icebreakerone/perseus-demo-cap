# Perseus CAP demo

A simple NextJS web application showing the perseus authentication and authorisation flow. The authorisation code flow is Fapi 2.0 compliant, and client requests are protected by mutual TLS. A cli is included for testing Perseus endpoints from the command line.


## Table of Contents

- [Testing Perseus EDP implementations](#testing-perseus-edp-implementations)
- [Testing Perseus CAP implementations](#testing-perseus-cap-implementations)
- [Getting Started](#getting-started)
- [Development with docker](#development-with-docker)
- [Certificates and keys](#certificates-and-keys)
  - [Using KMS keys](#using-kms-keys)
- [Using the CLI](#using-the-cli)
  - [Configuration](#configuration)
  - [Running against local environments](#running-against-local-environments)
  - [Example](#example)

## Testing Perseus EDP implementations

The cli can be used to test conformance of a Perseus EDP implementation. See [Testing an EDP using the Cap Demo cli](docs/edp_checks.md) for details.

## Testing Perseus CAP implementations

A guide to testing your CAP implementation is available in [Testing your CAP implementation against Perseus demo endpoints](docs/cap_checks.md)

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

## Development with docker

For work requiring the provenance service a development environment can be run with 

```bash
docker compose up
```

## Certificates and keys

The app requires the following certificates and keys:

- A private key belonging to the client
- A bundle containing a directory issued certificate generated from the private key and the intermediate CA certificate for the directory client issuer

All keys and certificates are in PEM format.

The client key and bundle are used for mutual TLS. 

For local development, these are local files. In production, these are stored in AWS Secrets Manager.

### Using KMS keys

The deployed provenance service creates a KMS key suitable for signing. See https://github.com/icebreakerone/provenance-service?tab=readme-ov-file#kms-key-setup for details of generating certificates from a kms key.


## Using the CLI

A cli is available to test endpoints. Running `npm run get_code` will:

- Create a [PAR](https://datatracker.ietf.org/doc/html/rfc9126)
- Use the PAR to create and display an authorisation URL

Once the url has been used to authorise the request, the callback will be received by the callback server which will:

- exchange the authorisation code for a token
- use the token to retrieve data from the defined endpoint
- request the associated provenance record and display it in the console

The test callback server can be started with `npm run start`.

See [edp_checks.md](edp_checks.md) for a detailed guide to testing an EDP implementation with this cli.

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
npm run get_code
```

Start the callback server in a separate terminal and complete the login through the browser when prompted:

```
cd cli
npm run start
```

If you wish to test signing of provenance records as well as authentication and retrieving data, run:

```
cd cli
npm run start:provenance
```
