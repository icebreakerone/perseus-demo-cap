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

## OpenID Client Connect
Developers can utilise OAuth Tools to test the OpenID Connect flow (web version only unless have a Curity license)

https://oauth.tools/?utm_source=curity.io&utm_medium=CTA&utm_content=OAuthTools

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.




NOTES:

Vercel PostGres DB
After running: npm i -g vercel@latest
to install the Vercel CLI, pull down the latest environment variables to get your local project working with the Postgres database:
vercel env pull .env.local

users table - possible additional parameters?
- createdAt     DateTime  @default(now()) @map(name: "created_at")
- updatedAt     DateTime  @updatedAt @map(name: "updated_at")
- preferences   Json?
- @@map(name: "users")


You can manage your database from the browser using Prisma by executing the command below:

    npx prisma studio