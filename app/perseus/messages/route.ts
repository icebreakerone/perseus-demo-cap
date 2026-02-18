import { NextRequest } from 'next/server'

import {
  decodeApplication,
  decodeMember,
  decodeRoles,
  parseCertificateFromHeader,
} from '@lib/ib1Cert'

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Read the client certificate from the mTLS header
  const certHeader = request.headers.get('X-Amzn-Mtls-Clientcert-Leaf')
  if (!certHeader)
    return jsonResponse({ error: 'No client certificate provided' }, 403)

  // 2. Parse certificate and extract sender attributes
  let application: string
  let member: string
  let roles: string[]
  try {
    const cert = parseCertificateFromHeader(certHeader)
    application = decodeApplication(cert)
    member = decodeMember(cert)
    roles = decodeRoles(cert)
  } catch (error) {
    console.error('Certificate parsing error:', error)
    return jsonResponse(
      {
        error: 'Invalid client certificate',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      403,
    )
  }

  // 3. Parse and validate the message body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body['ib1:message'])
    return jsonResponse({ error: 'Missing required field: ib1:message' }, 400)

  // 4. Enrich the message with sender information from the certificate
  const enrichedMessage = {
    ...body,
    sender: { application, member, roles },
  }

  console.log('Received IB1 message:', JSON.stringify(enrichedMessage, null, 2))

  return jsonResponse({ status: 'ok' })
}
