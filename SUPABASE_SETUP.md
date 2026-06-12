# Supabase Setup Guide

## 1. Create Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Note your project URL and anon key from Settings > API

## 2. Database Schema
Run `supabase-schema.sql` in the SQL Editor.

This creates:
- 15 tables with proper relationships
- Indexes for performance
- Row Level Security policies
- Auto-profile creation trigger
- Updated_at triggers

## 3. Authentication Setup

### Email Auth
- Settings: Authentication > Providers > Email
- Enable "Allow new users to sign up"

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Set redirect URI: `https://[project].supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

### Magic Link
- Enabled by default with Email provider

## 4. Storage Buckets
Create these buckets for file uploads:
- `avatars` - Participant photos
- `logos` - Event/team logos
- `posters` - Poster templates
- `certificates` - Certificate templates

## 5. Create Initial Admin
```sql
-- After signing up, run:
UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

## 6. Test Setup
1. Sign up at `/register`
2. Create your first event at `/dashboard/events/new`
3. Add categories, teams, participants
4. Create competitions and assign judges
5. Test judge panel at `/judge`
6. View results at `/results`
7. Try projector mode at `/projector/[event-id]`

## Database Tables

| Table | Purpose |
|-------|---------|
| profiles | User accounts with roles |
| events | Event management |
| categories | Competition categories |
| teams | Teams/Houses |
| participants | Student participants |
| competitions | Competition definitions |
| competition_judges | Judge assignments |
| scores | Marks and scoring |
| point_systems | Custom point rules |
| penalties | Penalty rules |
| penalty_logs | Applied penalties |
| certificates | Generated certificates |
| posters | Generated posters |
| audit_logs | Security audit trail |
| event_settings | Per-event configuration |
