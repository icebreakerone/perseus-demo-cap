# AGENTS.md

Guidance for coding agents working in this repository.

## Project Overview

Perseus CAP Demo is a Next.js web application demonstrating the FAPI 2.0 compliant
OAuth 2.0 authorisation code flow with mutual TLS (mTLS) for the IceBreaker One
trust framework. It plays the Carbon Accounting Provider (CAP) role: it authorises
against a demo authentication server, retrieves a year of meter readings from an
Energy Data Provider (EDP), and charts them. A CLI in `cli/` exercises the same
flow from the command line for testing EDP conformance.


## Specifications and References

Implementations in this repository **must** follow the IceBreaker One technical
specifications, indexed at <https://specification.trust.ib1.org/>. Where the code and a specification disagree, follow the specification.
Read the relevant one before changing the authentication flow, the certificate
handling, the message endpoint or the provenance record, and note any deviation
in `CHANGELOG.md` rather than leaving it implicit.

### Specifications

- [Directory](https://specification.trust.ib1.org/directory/1.0/) - member,
  application and data catalog metadata; the source of the `ib1:` RDF vocabulary
- [OAuth with Member Identity Certificates](https://specification.trust.ib1.org/oauth-with-member-identity-certificates/1.0/) -
  the FAPI 2.0 + mTLS flow this app implements
- [Message Delivery to Applications](https://specification.trust.ib1.org/message-delivery-to-applications/1.0/) -
  `app/perseus/messages/route.ts`
- [Provenance Records](https://specification.trust.ib1.org/provenance-records/1.0/) -
  the records the provenance service signs

### Registry objects this demo references

These are runtime values, not reading material: they are sent on the wire, are
version dated, and go stale when the scheme publishes a new date.

- Energy Consumption Data API (standard):
  `https://registry.core.sandbox.trust.ib1.org/scheme/perseus/standard/energy-consumption-data/2026-03-12`
- OAuth scope (license): `…/scheme/perseus/license/energy-consumption-emissions-edp-cap-fsp/2026-03-12`,
  in `lib/clientConfig.ts`. This is the pass-through license covering EDP → CAP → FSP,
  because the demo takes consent for all three in one permission;
  `…/license/energy-consumption-edp-cap/2026-03-12` covers only the EDP → CAP leg.
  The Ory client registration must list whichever license the code requests
- Scheme root: `https://registry.core.sandbox.trust.ib1.org/scheme/perseus` -
  the provenance service's `SCHEME_URI` (`compose.yml`, `deployment/deployment/provenance_service.py`)
- Trust framework: `https://registry.core.sandbox.trust.ib1.org/trust-framework` -
  the provenance service's `TRUST_FRAMEWORK_URL`
- Information provision policy:
  `https://registry.core.trust.ib1.org/scheme/perseus/policy/information-provision/2026-03-12` -
  linked from the sharing consent views
- RDF namespace: `https://registry.trust.ib1.org/ns/1.0#` - the `ib1:` prefix
- Directory identifiers: `https://directory.core.sandbox.trust.ib1.org/a/<app>` is
  the OAuth `client_id`; `/m/<member>` identifies the member

Registry URLs are environment scoped and matched as exact strings, so they cannot
be copied between environments: `registry.core.development.trust.ib1.org`,
`registry.core.sandbox.trust.ib1.org` and `registry.core.trust.ib1.org` are three
distinct registries. A certificate role scoped to the wrong one fails token
exchange with `401 … does not include role`.

## Build and Development Commands

### Web Application (root directory)
```bash
npm run dev              # Development server (localhost:3000)
npm run build            # Production build
npm run start            # Serve the production build
npm run lint             # ESLint
npm run lint:fix         # ESLint with --fix
npm run ts-lint          # TypeScript type checking (tsc --noEmit)
npm run format           # Check Prettier formatting
npm run format:fix       # Auto-fix formatting
npm run check-cert -- <env>   # Inspect the mTLS cert in Secrets Manager (dev|preprod|prod)
```

Next.js 16 runs on Turbopack by default; `dev` and `build` both pass `--webpack`
because `next.config.js` uses a `webpack()` hook for Docker file-watch polling.

### CLI (cli/ directory)
```bash
cd cli
npm run get_code         # Generate PAR and print the authorisation URL
npm run start            # Start callback server for token exchange + data fetch
npm run start:provenance # Callback server with provenance verification (ENABLE_PROVENANCE=true)
npm run refresh_token "<token>"  # Test refresh token flow
npx tsx verify_certs.ts  # Validate certificate files (key/bundle match, chain, expiry)
```

All CLI entry points accept `--insecure` / `-k`, which skips server certificate
verification for loopback hosts only (`localhost`, `127.0.0.1`, `[::1]`) so a
local server with a self-signed certificate does not fail with
`SELF_SIGNED_CERT_IN_CHAIN`. Pass it after `--` when using npm:
`npm run get_code -- --insecure`.

### Docker Development
```bash
docker compose up        # Next.js app, DynamoDB Local (:9090), provenance service (:8081)
```

### AWS CDK Deployment (deployment/ directory)
```bash
cd deployment
source .venv/bin/activate
pip install -r requirements.txt
cdk synth --context deployment_context=dev
cdk deploy --context deployment_context=dev   # dev | prod
```

`deployment_context` selects the environment block in `deployment/app.py`
(`dev` → `preprod.perseus-demo-cap.ib1.org`, `prod` → `perseus-demo-cap.ib1.org`)
and defaults to `dev` if omitted.

## Architecture

### Authentication Flow (FAPI 2.0 + mTLS)
1. `/auth/login` - Initiates OAuth with PAR (Pushed Authorization Request)
2. PAR request sent to the mTLS-protected authorisation server
3. User authorises at the EDP's authorization endpoint
4. `/auth/callback` - Receives the authorization code, exchanges it for a token via mTLS
5. Access token stored in an iron-session encrypted cookie

The OAuth scope is a Registry License URL, not a bare scope string
(see `lib/clientConfig.ts`); the Ory client registration must list whichever
license version the code requests.

### Routes
- `app/auth/login`, `app/auth/callback`, `app/auth/logout` - OAuth flow
- `app/api/getData/route.ts` - Fetches the metering window from the EDP resource API
  using the session token, sending `Accept-Encoding: gzip` (windows over 60 days
  are served compressed only)
- `app/api/session/route.ts` - Session state for the client components; returns
  `isLoggedIn` only. `app/session/route.ts` is a second, near-duplicate handler
  that returns the whole session, tokens included
- `app/perseus/messages/route.ts` - IB1 message delivery endpoint (e.g. token
  revocation). Reads the sender's certificate from the `X-Amzn-Mtls-Clientcert-Leaf`
  header injected by the ALB, and returns 403 without one
- `app/auth/openiddict/route.ts` - Largely commented out; legacy experiment

### Key Modules
- `lib/auth.ts` - OAuth orchestration, iron-session session management
- `lib/clientConfig.ts` - Certificate loading (local files or AWS Secrets Manager),
  undici mTLS agent configuration, environment resolution
- `lib/ib1Cert.ts` - Decodes IB1 application, member and role fields from a client
  certificate (private OIDs under `1.3.6.1.4.1.62329`)
- `lib/dateRange.ts` - The metering window: the previous twelve complete calendar months, UTC
- `lib/energySeries.ts` - Aggregates the EDP's half-hourly readings into monthly
  consumption buckets and a daily cumulative series
- `scripts/check-cert.ts` - Inspects the certificate stored in Secrets Manager
- `cli/config.ts` - CLI environment variable and command-line flag parsing
  (read positional arguments from its `positionalArgs` export, not `process.argv`)
- `cli/callback_server.ts` - Express server for testing the OAuth callback flow
- `cli/customFetch.ts` - mTLS-enabled fetch wrapper for the CLI

### The cli/ subproject
`cli/` is a standalone package with its own `package.json` and dependencies. It is
excluded from the root `tsconfig.json` and ignored by ESLint, so root path aliases
do **not** resolve there. Modules under `lib/` that the CLI shares (currently
`dateRange.ts`, `clientConfig.ts`) must be imported relatively (`../lib/dateRange`)
and must stay free of `next/*` imports and path aliases. `lib/package.json` marks
the directory as ESM so `tsx` can load it from the CLI.

### Certificate Management
- Local development: `./certs/cap-demo-certs/` (key.pem + bundle.pem), with a
  fallback to Secrets Manager if the local files are missing
- Deployed: AWS Secrets Manager at `{env}/perseus-demo-cap/mtls-key-bundle`
  in `eu-west-2`, as JSON with `mtlsKey` and `mtlsBundle` keys
- Bundle format: client (leaf) certificate first, then the intermediate CA.
  A leaf-only bundle fails the handshake
- The environment is `APP_ENV`, falling back to `ENVIRONMENT`, defaulting to `local`
- Certificate roles are registry-scoped: a role scoped to the wrong registry host
  (e.g. `sandbox` where `development` is expected) surfaces as
  `401 ... does not include role` at token exchange. `npm run check-cert` reports this

### Path Aliases (tsconfig.json)
```
@/* → ./
@assets/* → ./assets/
@components/* → ./components/
@lib/* → ./lib/
@services/* → ./services/
@utils/* → ./utils/
```

## Environment Configuration

### Web App (.env.local)
```
SECRET_COOKIE_PASSWORD=<session-encryption-key>   # from Secrets Manager when deployed
NEXT_PUBLIC_SERVER=<oauth-issuer-url>             # non-mTLS URL, for discovery
NEXT_PUBLIC_CLIENT_ID=<client-id>                 # directory entry URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PROTECTED_RESOURCE_URL=<resource-endpoint>
APP_ENV=local                                     # or ENVIRONMENT; selects the cert source
MTLS_KEY_PATH=./certs/...                         # local certificate overrides
MTLS_BUNDLE_PATH=./certs/...
```
See `.env.local.tmpl`.

### CLI (cli/.env)
```
CLI_PUBLIC_SERVER=<auth-server-url>
CLI_MTLS_AUTHORISATION_SERVER=<mtls-auth-server>
CLI_CLIENT_ID=<client-id>
CLI_REDIRECT_URI=http://localhost:3000/callback
CLI_POST_LOGIN_REDIRECT=http://localhost:3000/callback
CLI_PROTECTED_RESOURCE_URL=<resource-endpoint>
CLI_MTLS_KEY_PATH=../certs/cap-demo-certs/cap-demo-key.pem
CLI_MTLS_BUNDLE_PATH=../certs/cap-demo-certs/cap-demo-bundle.pem
CLI_SERVER_CA_PATH=                     # optional CA bundle for server verification
CLI_SKIP_SERVER_VERIFICATION=false      # true disables verification for every host
CLI_PROVENANCE_SERVICE_URL=http://localhost:8081
```
See `cli/env.template`. Prefer `--insecure` over `CLI_SKIP_SERVER_VERIFICATION`:
the flag only relaxes verification for loopback hosts.

## Code Style

- ESLint 9 flat config (`eslint.config.mjs`) with `eslint-config-next`,
  TypeScript, React hooks and Prettier integration
- Prettier: single quotes, **no semicolons**, trailing commas everywhere
  (`trailingComma: 'all'`), 2-space tabs, `arrowParens: 'avoid'`
- `curly: multi` - braces only for multi-line blocks
- Tailwind CSS 4 (CSS-first: `@import 'tailwindcss'` in `app/globals.css`,
  `@tailwindcss/postcss`), with the class-sorting Prettier plugin.
  `tailwind.config.js` still supplies theme extensions and the `cl-btn` components
- Strict TypeScript
- Comments explain *why*, not *what*; the existing modules under `lib/` are the
  reference for tone and density

## CI/CD

GitHub Actions (`.github/workflows/test_deploy.yml`):
- All pushes: `npm run lint` + format check
- `main` branch: CDK deploy with `deployment_context=prod`
- `preprod` branch: CDK deploy with `deployment_context=dev`

## Changelog

`CHANGELOG.md` is maintained by hand under an `[Unreleased]` heading with
`Added` / `Changed` / `Fixed` / `Removed` sections. Entries record the reasoning
behind a change, not just the change. Add to it for anything user- or
operator-visible.

## Documentation

- `README.md` - setup, certificates, message delivery endpoint, CLI usage
- `docs/edp_checks.md` - guide to validating an EDP against the Perseus spec with the CLI
- `docs/cap_checks.md` - guide to testing a CAP implementation against the demo endpoints
- `docs/generate_certificates.md` - creating test keys and certificates via the directory
