# MoltBot SaaS - Google Auth Fix

## Summary

Google OAuth login at https://moltbot-saas.vercel.app was broken due to:
1. **Google provider disabled** in Supabase (MAIN ISSUE)
2. **Site URL** was set to `http://localhost:3000` instead of production URL (FIXED)
3. **No Redirect URLs** were configured (FIXED)

## What Was Fixed

### 1. Supabase URL Configuration (FIXED ✅)
- **Site URL**: Changed from `http://localhost:3000` to `https://moltbot-saas.vercel.app`
- **Redirect URLs**: Added `https://moltbot-saas.vercel.app/**`

Location: https://supabase.com/dashboard/project/nverjjfyppsqogqbkfqm/auth/url-configuration

### 2. Vercel Environment Variables (VERIFIED ✅)
The following env vars are correctly configured in Vercel production:
- `NEXT_PUBLIC_SUPABASE_URL=https://nverjjfyppsqogqbkfqm.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...` (correct)
- `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...` (correct)
- `NEXT_PUBLIC_APP_URL=https://moltbot-saas.vercel.app`

## What Still Needs Manual Setup

### 3. Enable Google Provider in Supabase (MANUAL STEP REQUIRED ⚠️)

The Google provider is currently **DISABLED** in Supabase. To enable it:

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Application type: **Web application**
6. Name: `MoltBot SaaS`
7. Authorized JavaScript origins:
   - `https://moltbot-saas.vercel.app`
8. Authorized redirect URIs:
   - `https://nverjjfyppsqogqbkfqm.supabase.co/auth/v1/callback`
9. Click "Create"
10. Copy the **Client ID** and **Client Secret**

#### Step 2: Configure OAuth Consent Screen (if not done)

1. Go to "OAuth consent screen" in Google Cloud Console
2. User Type: External
3. Fill in required fields:
   - App name: MoltBot
   - User support email: jessmason23@gmail.com
   - Developer contact: jessmason23@gmail.com
4. Add scopes: `email`, `profile`, `openid`
5. Save and continue

#### Step 3: Enable Google Provider in Supabase

1. Go to [Supabase Auth Providers](https://supabase.com/dashboard/project/nverjjfyppsqogqbkfqm/auth/providers)
2. Click on "Google" in the provider list
3. Toggle "Enable Sign in with Google" ON
4. Enter:
   - **Client IDs**: (paste your Google Client ID)
   - **Client Secret**: (paste your Google Client Secret)
5. Click "Save"

## Configuration Reference

### Supabase Project
- Project ID: `nverjjfyppsqogqbkfqm`
- URL: `https://nverjjfyppsqogqbkfqm.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/nverjjfyppsqogqbkfqm

### Callback URL for Google OAuth
```
https://nverjjfyppsqogqbkfqm.supabase.co/auth/v1/callback
```

### App Auth Callback Route
The app handles the OAuth callback at `/auth/callback` which exchanges the code for a session.

## Code Structure

The auth flow is implemented in:
- `src/app/(auth)/login/page.tsx` - Login page with Google button
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/lib/supabase/client.ts` - Supabase browser client
- `src/lib/supabase/server.ts` - Supabase server client

## Testing After Setup

1. Go to https://moltbot-saas.vercel.app/login
2. Click "Continue with Google"
3. Should redirect to Google consent screen
4. After approval, redirects back to `/dashboard` or `/onboarding`

## Date
Fixed: January 28, 2025

## Notes
- No code changes were required - the auth implementation is correct
- The issue was purely configuration in Supabase Dashboard
- Google Cloud Console credentials need to be created manually (cannot be automated due to CAPTCHA)
