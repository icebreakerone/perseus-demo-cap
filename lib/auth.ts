import { IronSession, SessionOptions, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import * as client from 'openid-client'
import * as undici from 'undici'
import { readFileSync } from 'fs'

export interface IClientConfig {
  server: string;
  client_id: string;
  redirect_uri: string;
  mtlsBundlePath: string;
  mtlsKeyPath: string;
  serverCaPath: string;
  scope: string;
  response_type: string;
  grant_type: string;
  post_login_route: string;
  code_challenge_method: string;
}


export const clientConfig: IClientConfig = {
  server: process.env.NEXT_PUBLIC_SERVER as string,
  client_id: process.env.NEXT_PUBLIC_CLIENT_ID as string,
  redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  mtlsBundlePath: './certs/local-development-bundle.pem',
  mtlsKeyPath: './certs/local-development-key.pem',
  serverCaPath: './certs/directory-server-certificates/bundle.pem',
  scope: process.env.NEXT_PUBLIC_SCOPE as string,
  response_type: 'code',
  grant_type: 'authorization_code',
  post_login_route: process.env.NEXT_PUBLIC_APP_URL as string,
  code_challenge_method: 'S256'
}

export interface SessionData {
  isLoggedIn: boolean;
  access_token?: string;
  code_verifier?: string;
  state?: string;
  tenantId?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string,
  cookieName: "iron-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
  }

  return session;
}

// Create custom fetch with mTLS
export function createCustomFetch() {
  // In server components, we can read files
  const key = readFileSync(clientConfig.mtlsKeyPath, 'utf8');
  const cert = readFileSync(clientConfig.mtlsBundlePath, 'utf8');
  const ca = readFileSync(clientConfig.serverCaPath, 'utf8');

  const agent = new undici.Agent({
    connect: {
      key,
      cert,
      ca,
    },
  });

  return async (url: string, options = {}) => {
    return undici.fetch(url, { ...options, dispatcher: agent }) as unknown as Response;
  };
}

export async function getClientConfig() {
  const customFetch = createCustomFetch();

  // Use discovery with mTLS
  const issuer = await client.discovery(
    new URL('/.well-known/oauth-authorization-server', clientConfig.server),
    // @ts-ignore
    clientConfig.client_id,
    { use_mtls_endpoint_aliases: true },
    client.TlsClientAuth(),
    { [client.customFetch]: customFetch }
  );

  return issuer;
}

export async function generateAuthUrl(session: IronSession<SessionData>) {
  const issuer = await getClientConfig();

  // Generate PKCE code verifier and challenge
  const code_verifier = client.randomPKCECodeVerifier();
  const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

  // Store code_verifier in session for later token exchange
  session.code_verifier = code_verifier;

  // Prepare PAR request
  const customFetch = createCustomFetch();
  const parEndpoint = issuer.serverMetadata().pushed_authorization_request_endpoint;

  if (!parEndpoint) {
    throw new Error('PAR endpoint not found in server metadata');
  }

  const parameters = {
    client_id: clientConfig.client_id,
    redirect_uri: clientConfig.redirect_uri,
    response_type: 'code',
    scope: clientConfig.scope,
    code_challenge,
    code_challenge_method: 'S256',
  };

  // Make PAR request
  const parResponse = await customFetch(parEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // @ts-ignore
    body: new URLSearchParams(parameters).toString(),
  });

  if (!parResponse.ok) {
    throw new Error(`PAR request failed: ${parResponse.status} ${parResponse.statusText}`);
  }

  const parData = await parResponse.json();

  // Generate authorization URL with request_uri
  const authEndpoint = issuer.serverMetadata().authorization_endpoint;
  if (!authEndpoint) {
    throw new Error('Authorization endpoint not found');
  }

  const authUrl = new URL(authEndpoint);
  // @ts-ignore
  authUrl.searchParams.set('client_id', clientConfig.client_id);
  authUrl.searchParams.set('request_uri', parData.request_uri);

  await session.save();

  return authUrl.href;
}
