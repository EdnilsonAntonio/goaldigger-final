This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Cron Job Configuration

This application includes a cron job that automatically resets recurring tasks at midnight every day. The cron job is configured in `vercel.json` and will run automatically when deployed on Vercel.

### Environment Variables

To secure the cron job endpoint, you can optionally set a `CRON_SECRET` environment variable:

```bash
CRON_SECRET=your-secret-token-here
```

If set, the cron job endpoint will require this secret token in the `Authorization` header (as `Bearer <token>`) or as a `secret` query parameter.

### Manual Testing

You can manually trigger the cron job by calling:

```bash
# Without secret (if CRON_SECRET is not set)
curl https://your-domain.com/api/cron/reset-tasks

# With secret token
curl -H "Authorization: Bearer your-secret-token" https://your-domain.com/api/cron/reset-tasks
# or
curl https://your-domain.com/api/cron/reset-tasks?secret=your-secret-token
```

### Alternative Cron Services

If you're not using Vercel, you can use external cron services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Configure them to call `https://your-domain.com/api/cron/reset-tasks` daily at midnight (00:00 UTC or your preferred timezone).
