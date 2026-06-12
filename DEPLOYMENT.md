# FestBoard Deployment Guide

## Prerequisites
- Node.js 18+
- npm
- Supabase account (free tier works)
- Vercel account (free tier works)

## Step 1: Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase-schema.sql`
3. Run the SQL to create all tables, triggers, and RLS policies
4. Go to **Authentication > Providers** and enable:
   - Email (disable "Confirm email" for testing)
   - Google (configure OAuth credentials)
5. Go to **Project Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Local Setup

```bash
# Clone and install
npm install

# Copy environment variables
cp .env.local.example .env.local

# Fill in your Supabase credentials in .env.local
# Run development server
npm run dev
```

## Step 3: Vercel Deployment

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and import repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `NEXT_PUBLIC_APP_NAME` | "FestBoard" |

## Creating Super Admin

After first deployment:
1. Sign up with your email
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'your@email.com';
```

## Architecture

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **UI**: Shadcn UI components + Framer Motion animations
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel (serverless)

## Multi-Tenant Design

Each organization signs up independently. Row-Level Security (RLS) ensures:
- Event admins can only access their own events
- Judges can only access assigned competitions
- Students can only view their own data
- Public users can only view published results

## Features Checklist

- [x] Authentication (Email, Google, Magic Link)
- [x] Multi-Event System with duplication
- [x] Custom Categories & Teams
- [x] Participant management with auto chest numbers
- [x] Competition & Judge management
- [x] Scoring system (draft/submit/approve)
- [x] Point system customization
- [x] Live leaderboard & Projector mode
- [x] Student portal & Public results
- [x] QR Code generation
- [x] Certificate & Poster generation
- [x] Analytics dashboard
- [x] Multi-language (English, Malayalam, Arabic)
- [x] Import/Export (Excel)
- [x] Dark mode / Light mode
- [x] Responsive design
- [x] RLS & Role-based access control
