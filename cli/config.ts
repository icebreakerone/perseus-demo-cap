import { config as dotenvConfig } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env file from the cli directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenvConfig({ path: resolve(__dirname, '.env') })

// Hostnames treated as "local" by the --insecure switch. A local server is
// normally run with a self-signed certificate, which otherwise fails with
// SELF_SIGNED_CERT_IN_CHAIN.
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']

const args = process.argv.slice(2)
const flags = args.filter(arg => arg.startsWith('-'))

// Every entry point shares this parsing, so positional arguments (e.g. the
// refresh token) must be read from here rather than from process.argv directly.
export const positionalArgs = args.filter(arg => !arg.startsWith('-'))

const unknownFlags = flags.filter(
  flag => !['--insecure', '-k'].includes(flag.split('=')[0]),
)
if (unknownFlags.length > 0) {
  console.error(`Unknown option(s): ${unknownFlags.join(', ')}`)
  console.error('Supported options: --insecure (-k)')
  process.exit(1)
}

// --insecure/-k disables server certificate verification for localhost only.
// CLI_SKIP_SERVER_VERIFICATION remains the (blunter) way to disable it for
// every host.
const insecureLocalhost = flags.some(flag =>
  ['--insecure', '-k'].includes(flag),
)

export const config = {
  publicServer: new URL(
    process.env.CLI_PUBLIC_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org', //'https://localhost:8000'
  ),
  mTLSAuthorisationServer: new URL(
    process.env.CLI_MTLS_AUTHORISATION_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org',
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
  skipServerVerification: ['true', '1', 'yes'].includes(
    process.env.CLI_SKIP_SERVER_VERIFICATION?.toLowerCase() ?? '',
  ),
  insecureLocalhost,
  insecureHosts: insecureLocalhost ? LOOPBACK_HOSTS : undefined,
  protectedResourceUrl: new URL(
    process.env.CLI_PROTECTED_RESOURCE_URL ??
      'https://preprod.mtls.perseus-demo-energy.ib1.org/datasources/', //'https://localhost:8010/datasources/'
  ),
  provenanceServiceUrl: new URL(
    process.env.CLI_PROVENANCE_SERVICE_URL ?? 'http://localhost:8081',
  ),
  mtlsAuthorisationServer: new URL(
    process.env.CLI_MTLS_AUTHORISATION_SERVER ??
      'https://mtls.perseus-demo-authentication.ib1.org',
  ),
}
