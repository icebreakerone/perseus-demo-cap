import * as x509 from '@peculiar/x509'
import * as asn1js from 'asn1js'

const ROLE_OID = '1.3.6.1.4.1.62329.1.1'
const MEMBER_OID = '1.3.6.1.4.1.62329.1.3'

/**
 * Parse a client certificate from the X-Amzn-Mtls-Clientcert-Leaf header.
 * The header value is a URL-encoded PEM string.
 */
export function parseCertificateFromHeader(
  headerValue: string,
): x509.X509Certificate {
  const pem = decodeURIComponent(headerValue)
  return new x509.X509Certificate(pem)
}

/**
 * Extract the Application URL from the SubjectAlternativeName extension (URI type).
 */
export function decodeApplication(cert: x509.X509Certificate): string {
  const san = cert.getExtension(x509.SubjectAlternativeNameExtension)
  if (!san)
    throw new Error(
      'Client certificate does not include application information',
    )

  const uri = san.names.items.find(name => name.type === 'url')
  if (!uri)
    throw new Error(
      'Client certificate does not include application information',
    )

  return uri.value
}

/**
 * Decode the Member URL from custom extension OID 1.3.6.1.4.1.62329.1.3.
 * The value is a DER-encoded UTF8String.
 */
export function decodeMember(cert: x509.X509Certificate): string {
  const ext = cert.getExtension(MEMBER_OID)
  if (!ext)
    throw new Error('Client certificate does not include member information')

  const asn = asn1js.fromBER(ext.value)
  if (asn.offset === -1)
    throw new Error('Failed to decode member extension DER value')

  const utf8String = asn.result as asn1js.Utf8String
  return utf8String.valueBlock.value
}

/**
 * Decode Roles from custom extension OID 1.3.6.1.4.1.62329.1.1.
 * The value is a DER-encoded SEQUENCE OF UTF8String.
 */
export function decodeRoles(cert: x509.X509Certificate): string[] {
  const ext = cert.getExtension(ROLE_OID)
  if (!ext)
    throw new Error('Client certificate does not include role information')

  const asn = asn1js.fromBER(ext.value)
  if (asn.offset === -1)
    throw new Error('Failed to decode roles extension DER value')

  const sequence = asn.result as asn1js.Sequence
  return sequence.valueBlock.value.map(
    item => (item as asn1js.Utf8String).valueBlock.value,
  )
}
