/**
 * Inspect the mTLS client certificate stored in AWS Secrets Manager and print
 * its IB1 identity fields (application, member, roles) plus basic validity.
 *
 * Usage:
 *   npm run check-cert -- <env>      (env: dev | preprod | prod, default: dev)
 *   npx tsx scripts/check-cert.ts dev
 *
 * Requires ambient AWS credentials for the account holding the secret
 * `<env>/perseus-demo-cap/mtls-key-bundle` in eu-west-2.
 */
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager'
import * as x509 from '@peculiar/x509'
import { decodeApplication, decodeMember, decodeRoles } from '../lib/ib1Cert'

const REGION = 'eu-west-2'
const EXPECTED_ROLE_SUFFIX = '/role/carbon-accounting-provider'

const env = process.argv[2] ?? 'dev'
const secretName = `${env}/perseus-demo-cap/mtls-key-bundle`

const tryDecode = (label: string, fn: () => string | string[]) => {
  try {
    const value = fn()
    console.log(`  ${label}:`, value)
    return value
  } catch (e) {
    console.log(`  ${label}: ⚠ not present (${(e as Error).message})`)
    return undefined
  }
}

const main = async () => {
  console.log(
    `Fetching secret "${secretName}" from Secrets Manager (${REGION})`,
  )

  const client = new SecretsManagerClient({ region: REGION })

  let secretString: string | undefined
  try {
    const data = await client.send(
      new GetSecretValueCommand({ SecretId: secretName }),
    )
    secretString = data.SecretString
  } catch (e) {
    console.error(`\n✖ Failed to read secret "${secretName}":`)
    console.error(`  ${(e as Error).message}`)
    console.error(
      '\n  Check that you have AWS credentials for the right account ' +
        '(e.g. `aws sso login`) and that the env name is correct.',
    )
    process.exit(2)
  }

  if (!secretString) {
    console.error('✖ Secret has no SecretString value')
    process.exit(2)
  }

  const secret = JSON.parse(secretString)
  const mtlsBundle: string | undefined = secret.mtlsBundle
  if (!mtlsBundle) {
    console.error('✖ Secret JSON is missing "mtlsBundle"')
    process.exit(2)
  }

  const certMatches = mtlsBundle.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
  )
  if (!certMatches || certMatches.length === 0) {
    console.error('✖ No certificates found in mtlsBundle')
    process.exit(2)
  }

  console.log(`\nBundle contains ${certMatches.length} certificate(s)\n`)

  let roles: string[] | undefined

  certMatches.forEach((pem, index) => {
    const cert = new x509.X509Certificate(pem)
    const role = index === 0 ? ' (leaf / client certificate)' : ''
    console.log(`Certificate #${index}${role}`)
    console.log(`  Subject:   ${cert.subject}`)
    console.log(`  Issuer:    ${cert.issuer}`)
    console.log(`  Serial:    ${cert.serialNumber}`)
    console.log(`  Not before: ${cert.notBefore.toISOString()}`)
    console.log(`  Not after:  ${cert.notAfter.toISOString()}`)

    if (index === 0) {
      tryDecode('Application', () => decodeApplication(cert))
      tryDecode('Member', () => decodeMember(cert))
      roles = tryDecode('Roles', () => decodeRoles(cert)) as
        | string[]
        | undefined
    }
    console.log()
  })

  const now = new Date()
  const leaf = new x509.X509Certificate(certMatches[0])
  if (now < leaf.notBefore || now > leaf.notAfter)
    console.log('⚠ Leaf certificate is NOT currently valid (date out of range)')

  console.log('Summary')
  if (!roles || roles.length === 0) {
    console.log(
      '  ✖ Leaf certificate has no roles extension (OID 1.3.6.1.4.1.62329.1.1)',
    )
    process.exit(1)
  }

  console.log('  Roles on certificate:')
  for (const r of roles) console.log(`    - ${r}`)

  const caRoles = roles.filter(r => r.endsWith(EXPECTED_ROLE_SUFFIX))
  if (caRoles.length === 0) {
    console.log('  ✖ No carbon-accounting-provider role present')
    process.exit(1)
  }

  // The role string is scoped to a specific trust-framework registry host
  // (e.g. registry.core.sandbox.trust.ib1.org vs ...development...). A cert
  // with the right role name but the wrong registry host still 401s with
  // "Client certificate does not include role ...", so surface the host(s).
  const registryHosts = Array.from(new Set(caRoles.map(r => new URL(r).host)))
  console.log('  ✔ carbon-accounting-provider role present')
  console.log(`    scoped to registry host(s): ${registryHosts.join(', ')}`)
  console.log(
    '    NB: this host must match the trust framework the target server runs ' +
      'on\n    (a sandbox-scoped role will be rejected by a development server).',
  )
}

main().catch(e => {
  console.error('Unexpected error:', e)
  process.exit(2)
})
