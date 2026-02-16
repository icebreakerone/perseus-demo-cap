# Testing your CAP implementation against Perseus demo endpoints

## Generate a testing key and certificate

Follow the instructions in [Generate a testing key and certificate](generate_certificates.md) to create an application and required certificates.

## Configure your CAP implementation

Configure your CAP implementation to use the Perseus demo authentication server and energy data endpoints. As an example, the following environment variables would be used to setup the cli application in this repo to connect to the Perseus demo endpoints:

```bash
# .env
CLI_MTLS_BUNDLE_PATH=../certs/cli-test/j4l5deko-client-bundle.pem # custom certificate path
CLI_MTLS_KEY_PATH=../certs/cli-test/j4l5deko-client-key.pem # custom key path

# Your public server URL with a .well-known/oauth-authorization-server endpoint
CLI_PUBLIC_SERVER=https://perseus-demo-authentication.ib1.org
# mTLS authorisation server URL (for permissions endpoint)
CLI_MTLS_AUTHORISATION_SERVER=https://mtls.perseus-demo-authentication.ib1.org
# Your sandbox issued application ID
CLI_CLIENT_ID=https://directory.core.sandbox.trust.ib1.org/a/j4l5deko
# Your protected data endpoint
CLI_PROTECTED_RESOURCE_URL=https://perseus-demo-energy.ib1.org
```

*nb. the above is for an application with the id `https://directory.core.sandbox.trust.ib1.org/a/j4l5deko`. Replace with your own application id and certificate files as required.*

## Required steps to complete (stage 1)

1. **OAuth Discovery** — Fetch `/.well-known/oauth-authorization-server` from the auth server. Use the response to configure your oauth client.

2. **PKCE setup** — Generate a cryptographically random `code_verifier` and derive `code_challenge` (SHA-256). Persist the verifier for the callback step.

3. **Pushed Authorization Request (PAR)** — POST to `pushed_authorization_request_endpoint` (mTLS) with `client_id`, `redirect_uri`, `response_type`, `scope`, `code_challenge`, `code_challenge_method` as form-urlencoded body. Receive `request_uri` in response.

4. **Authorization redirect** — Build authorization URL with `client_id` and `request_uri` from PAR. Redirect user to `authorization_endpoint`; user authenticates and CAP grants consent.

5. **Handle callback** — Receive `code` in the redirect query params at your `redirect_uri`. 

6. **Token exchange** — POST to `token_endpoint` (mTLS) with `code`, `client_id`, `redirect_uri`, `code_verifier`, `grant_type`. Receive `access_token` and `refresh_token`.

7. **Fetch meter catalog** — GET `{protectedResourceUrl}/datasources/` (mTLS) with `Authorization: Bearer {access_token}`. Expect JSON with `data` array of meter objects including `id` and `availableMeasures`.

8. **Fetch meter consumption data** — GET `{protectedResourceUrl}/datasources/{meterId}/{measure}?from=YYYY-MM-DD&to=YYYY-MM-DD` (mTLS) with Bearer token. Expect JSON response with consumption data (and optionally `provenance`).

9. **Permissions verification** — POST `token` (refresh_token) to `/api/v1/permissions` (mTLS) on the authorisation server as form-urlencoded. Must succeed with 200 and valid JSON to confirm CAP has granted the expected permissions.


