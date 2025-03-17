# Perseus CAP demo

A simple web application showing the perseus authentication and authorisation flow. The authorisation code flow is Fapi 2.0 compliant. Client requests are protected by mutual TLS. A [cli showing the same flow](cli/README.md) is available in the cli directory, and may be useful for members developing their own integrations.


## Next app

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Optionally, create .env.local to override values in the .env file

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
