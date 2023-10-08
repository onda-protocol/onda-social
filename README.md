## Onda dApp

This fullstack app serves the Onda Community dApp in addition to handling indexing of forums via Helius Webhooks.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

A PostgreSQL database is required for indexing data via Helius. Because the API uses the Next.js Edge Runtime, the Prisma Client requires a Data Proxy connection.

Vercel offers free Postgres hosting to Pro users and a Prisma Data Proxy can be setup for free @ [https://cloud.prisma.io/](https://cloud.prisma.io/).

Additionally, a [Magic](https://magic.link/) account is required for Social Logins. Their free tier allows upto 1000 DAUs.

Finally, a [Helius](https://www.helius.dev/) Webhook should be created for the following program addresses:

```
ondaTPaRbk5xRJiqje7DS8n6nFu7Hg6jvKthXNemsHg
Awrdi1SPuntNpnm1hvDVDNsLnxg4zVotHsYF4FWNyaFj
namev2tpRrZEN9VWNKoktWxTJ9bYxkyVXCJJqZtuMuG
```

Provide the follow to a `.env`

```
MIGRATE_DATABASE_URL=[Postgres connection string]
DATABASE_URL=[Data Proxy connection string]
WEBHOOK_AUTH_TOKEN=[Authentication string for Helius Webhooks]
SIGNER_SECRET_KEY=[Secret Key for Gassless Relay]
HELIUS_API_KEY=[Helius API Key]
HELIUS_RPC_URL=[Helius RPC Endpoint]

NEXT_PUBLIC_BUNDLR_URL=[Bundlr Node]
NEXT_PUBLIC_HOST=http://localhost:3000
NEXT_PUBLIC_RPC_ENDPOINT=[Public RPC Endpoint]
NEXT_PUBLIC_MAGIC_PUBKEY=[Magic Pubkey]
NEXT_PUBLIC_AUTH_MESSAGE="Please sign this message to sign in";
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
