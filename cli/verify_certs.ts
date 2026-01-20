import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createPrivateKey, X509Certificate } from 'crypto'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { randomBytes } from 'crypto'

// Load .env file from the cli directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dotenvConfig = (await import('dotenv')).config({
  path: resolve(__dirname, '.env'),
})

const mtlsBundlePath =
  process.env.CLI_MTLS_BUNDLE_PATH ??
  '../certs/cap-demo-certs/cap-demo-bundle.pem'
const mtlsKeyPath =
  process.env.CLI_MTLS_KEY_PATH ?? '../certs/cap-demo-certs/cap-demo-key.pem'

console.log('--------------------------------')
console.log('Certificate Verification')
console.log('--------------------------------')
console.log(`Key path: ${mtlsKeyPath}`)
console.log(`Bundle path: ${mtlsBundlePath}`)
console.log()

// Resolve paths relative to cli directory
const resolvedKeyPath = resolve(__dirname, mtlsKeyPath)
const resolvedBundlePath = resolve(__dirname, mtlsBundlePath)

try {
  // Read the key
  console.log('Reading private key...')
  const mtlsKey = readFileSync(resolvedKeyPath, 'utf8')
  console.log(`✅ Key file read (${mtlsKey.length} bytes)`)
  console.log(`   Starts with: ${mtlsKey.substring(0, 50)}...`)
  console.log()

  // Read the bundle
  console.log('Reading certificate bundle...')
  const mtlsBundle = readFileSync(resolvedBundlePath, 'utf8')
  console.log(`✅ Bundle file read (${mtlsBundle.length} bytes)`)
  console.log(`   Starts with: ${mtlsBundle.substring(0, 50)}...`)
  console.log()

  // Parse the private key (assuming EC)
  console.log('Parsing private key (assuming EC algorithm)...')
  const privateKey = createPrivateKey(mtlsKey)
  const keyAlgorithm = privateKey.asymmetricKeyType || 'ec'
  console.log(`✅ Private key parsed successfully`)
  console.log(`   Algorithm: ${keyAlgorithm}`)
  if (privateKey.asymmetricKeySize) {
    console.log(`   Key size: ${privateKey.asymmetricKeySize} bits`)
  }
  console.log()

  // Extract the first certificate from the bundle
  // PEM format: certificates are separated by "-----BEGIN CERTIFICATE-----" and "-----END CERTIFICATE-----"
  const certMatches = mtlsBundle.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
  )

  if (!certMatches || certMatches.length === 0) {
    console.error('❌ No certificates found in bundle!')
    console.error(
      '   Bundle should contain at least one certificate in PEM format',
    )
    process.exit(1)
  }

  console.log(`Found ${certMatches.length} certificate(s) in bundle`)
  console.log()

  // Check each certificate
  let foundMatchingCert = false
  for (let i = 0; i < certMatches.length; i++) {
    const certPem = certMatches[i]
    console.log(`Checking certificate ${i + 1}...`)

    try {
      const cert = new X509Certificate(certPem)
      console.log(`   Subject: ${cert.subject}`)
      console.log(`   Issuer: ${cert.issuer}`)
      console.log(`   Valid from: ${cert.validFrom}`)
      console.log(`   Valid to: ${cert.validTo}`)

      // Verify if the key matches this certificate using OpenSSL (for EC keys)
      try {
        // Create temporary files for OpenSSL comparison
        const tempDir = tmpdir()
        const tempId = randomBytes(8).toString('hex')
        const tempCertPath = resolve(tempDir, `cert-${tempId}.pem`)
        const tempKeyPath = resolve(tempDir, `key-${tempId}.pem`)

        try {
          // Write temporary files
          writeFileSync(tempCertPath, certPem, 'utf8')
          writeFileSync(tempKeyPath, mtlsKey, 'utf8')

          // Extract public keys using OpenSSL and compare their MD5 hashes
          const certPubKeyHash = execSync(
            `openssl x509 -noout -pubkey -in "${tempCertPath}" | openssl md5`,
            { encoding: 'utf8' },
          ).trim()

          const keyPubKeyHash = execSync(
            `openssl ec -pubout -in "${tempKeyPath}" 2>/dev/null | openssl md5`,
            { encoding: 'utf8' },
          ).trim()

          // Compare hashes
          if (certPubKeyHash === keyPubKeyHash) {
            console.log(`   ✅ KEY MATCHES THIS CERTIFICATE!`)
            foundMatchingCert = true
          } else {
            console.log(`   ❌ Key does not match this certificate`)
            console.log(`   Certificate public key hash: ${certPubKeyHash}`)
            console.log(`   Private key public key hash: ${keyPubKeyHash}`)
          }
        } finally {
          // Clean up temporary files
          try {
            unlinkSync(tempCertPath)
            unlinkSync(tempKeyPath)
          } catch {
            // Ignore cleanup errors
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Could not verify key match using OpenSSL: ${err}`)
        console.log(
          `   💡 Make sure OpenSSL is installed and available in PATH`,
        )
      }
      console.log()
    } catch (err) {
      console.error(`   ❌ Failed to parse certificate ${i + 1}: ${err}`)
      console.log()
    }
  }

  if (!foundMatchingCert) {
    console.error('--------------------------------')
    console.error(
      '❌ ERROR: No certificate in the bundle matches the private key!',
    )
    console.error('--------------------------------')
    console.error('This means:')
    console.error(
      '  1. The certificate in the bundle was not generated from this key, OR',
    )
    console.error('  2. The bundle contains the wrong certificate, OR')
    console.error('  3. You are using the wrong key file')
    console.error()
    console.error('To fix this:')
    console.error(
      '  1. Make sure the bundle contains the certificate that was generated with this key',
    )
    console.error('  2. The bundle should be in PEM format:')
    console.error('     -----BEGIN CERTIFICATE-----')
    console.error('     ...certificate data...')
    console.error('     -----END CERTIFICATE-----')
    console.error('     (optionally followed by intermediate CA certificates)')
    process.exit(1)
  }

  console.log('--------------------------------')
  console.log('✅ SUCCESS: Certificate and key match!')
  console.log('--------------------------------')
} catch (error) {
  console.error('--------------------------------')
  console.error('❌ ERROR:', error instanceof Error ? error.message : error)
  console.error('--------------------------------')
  if (error instanceof Error && error.message.includes('ENOENT')) {
    console.error('File not found. Check your paths in .env:')
    console.error(`  CLI_MTLS_KEY_PATH=${mtlsKeyPath}`)
    console.error(`  CLI_MTLS_BUNDLE_PATH=${mtlsBundlePath}`)
  }
  process.exit(1)
}
