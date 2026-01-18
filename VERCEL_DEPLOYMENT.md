# Vercel Deployment Guide

## Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

### Required Variables:
- `DATABASE_URL` - Your PostgreSQL database connection string
- `DIRECT_URL` - Direct database connection URL (for migrations)
- `OPENAI_API_KEY` - Your OpenAI API key

### Setting Environment Variables in Vercel:
1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add each variable for Production, Preview, and Development environments

## Build Configuration

The project is configured with:
- **Postinstall script**: Automatically generates Prisma client after `npm install`
- **Build command**: `prisma generate && next build`
- **Framework**: Next.js 16

## Prisma Setup

The project uses Prisma with PostgreSQL. Make sure:
1. Your database is accessible from Vercel's IP ranges
2. Connection pooling is configured (if using services like Supabase or Neon)
3. `DIRECT_URL` is set for migrations (can be same as `DATABASE_URL` for most providers)

## Common Issues

### Build Fails with "Prisma Client not generated"
- Solution: The `postinstall` script should handle this automatically
- If it still fails, ensure `prisma` is in `dependencies` (not `devDependencies`)

### Database Connection Errors
- Check that `DATABASE_URL` and `DIRECT_URL` are set correctly
- Verify database allows connections from Vercel's IP ranges
- For connection pooling, use the pooled connection string in `DATABASE_URL`

### Missing Environment Variables
- All required variables must be set in Vercel dashboard
- Restart deployment after adding new variables

## Deployment Steps

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in Vercel
3. Set environment variables in Vercel dashboard
4. Vercel will automatically detect Next.js and use the build configuration
5. Deploy!
