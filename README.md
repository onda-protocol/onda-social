## Onda dApp

This fullstack app serves the Onda Community dApp in addition to handling indexing of forums via Helius Webhooks.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

A PostgreSQL database is required for indexing data via Helius. Because the API uses the Next.js Edge Runtime, the Prisma Client requires a Data Proxy connection.

Vercel offers free Postgres hosting to Pro users and a Prisma Data Proxy can be setup for free @ [https://cloud.prisma.io/](https://cloud.prisma.io/).

The API is served on

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
