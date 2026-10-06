import * as openid from 'openid-client'

// Shared with the CLI, so this module must stay free of next/* imports and
// path aliases (see AGENTS.md, "The cli/ subproject").

// The endpoints the client calls with its certificate. The IB1 OAuth profile
// has the authorization server publish these under mtls_endpoint_aliases, so
// that is where they are read from first.
export type MtlsEndpoint =
  | 'pushed_authorization_request_endpoint'
  | 'token_endpoint'
  | 'revocation_endpoint'
  | 'ib1_permission_endpoint'

/**
 * Fetch the authorization server metadata for an issuer identifier.
 *
 * Passing the issuer rather than a /.well-known/ URL lets openid-client build
 * the RFC 8414 location and reject metadata that names a different issuer,
 * which it skips when handed the metadata URL directly. The metadata host
 * takes no client certificate; `fetch` is only needed to reach a local server
 * with a self-signed certificate.
 */
export const discover = async (
  issuer: URL,
  clientId: string,
  fetch?: openid.CustomFetch,
) =>
  openid.discovery(issuer, clientId, undefined, undefined, {
    algorithm: 'oauth2',
    ...(fetch && { [openid.customFetch]: fetch }),
  })

export const mtlsEndpoint = (
  config: openid.Configuration,
  name: MtlsEndpoint,
): string => {
  const metadata = config.serverMetadata()
  const endpoint = metadata.mtls_endpoint_aliases?.[name] ?? metadata[name]
  if (typeof endpoint !== 'string')
    throw new Error(`${name} is missing from the authorization server metadata`)
  return endpoint
}

/**
 * Check the redirect back from the authorization endpoint before its code is
 * used: an error is reported rather than treated as a missing code, `state`
 * must be the one this client sent, and `iss` (RFC 9207, which the server
 * advertises) must be the issuer the client discovered, so a response from
 * another server cannot be replayed here.
 */
export const checkAuthorizationResponse = (
  params: URLSearchParams,
  config: openid.Configuration,
  expectedState: string | undefined,
): string => {
  const error = params.get('error')
  if (error)
    throw new Error(
      `Authorization failed: ${error}${params.get('error_description') ? ` - ${params.get('error_description')}` : ''}`,
    )

  if (!expectedState || params.get('state') !== expectedState)
    throw new Error('Authorization response state does not match the request')

  const iss = params.get('iss')
  const issuer = config.serverMetadata().issuer
  if (
    config.serverMetadata().authorization_response_iss_parameter_supported &&
    (!iss || new URL(iss).href !== new URL(issuer).href)
  )
    throw new Error(
      `Authorization response iss ${iss} does not match the issuer ${issuer}`,
    )

  const code = params.get('code')
  if (!code) throw new Error('No authorization code received')
  return code
}
