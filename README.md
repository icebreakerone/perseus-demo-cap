# Perseus CAP demo

A simple web application showing the perseus authentication and authorisation flow. The authorisation code flow is Fapi 2.0 compliant. Client requests are protected by mutual TLS. A [cli showing the same flow](cli/README.md) is available in the cli directory, and may be useful for members developing their own integrations.

## Next app

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Certificates and keys

The app requires the following certificates and keys:

- A private key belonging to the client
- A bundle containing a directory issued certificate generated from the private key and the intermediate CA certificate for the directory client issuer
- A bundle containing the directory CA root and intermediate certificate for the directory server issuer

All keys and certificates are in PEM format.

The client key and bundle are used for mutual TLS. The server certificate is used to verify the server's identity.

For local development, these are local files. In production, these are stored in AWS Secrets Manager.
