# 🚨 URGENT: Supabase Setup Required

## The Issue
Your OAuth callback is failing because **Supabase is not properly configured**. The environment variables are missing or contain placeholder values.

## Step 1: Create Environment File

Create a file called `.env` in the `frontend` directory with your actual Supabase credentials:

```bash
# Navigate to frontend directory
cd frontend

# Create .env file
touch .env  # On Windows: type nul > .env
```

## Step 2: Add Your Supabase Credentials

Edit the `.env` file and add your actual Supabase project details:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ACTUAL_ANON_KEY

# API Configuration
VITE_API_URL=http://localhost:3001/api

# App Configuration
VITE_APP_NAME=HOME BONZENGA
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

## Step 3: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings → API**
4. **Copy the following values**:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public key** → Use for `VITE_SUPABASE_ANON_KEY`

## Step 4: Configure OAuth Redirect URL

1. **In your Supabase Dashboard**, go to **Authentication → URL Configuration**
2. **Add this redirect URL**: `http://localhost:3003/auth/callback`
3. **Save the configuration**

## Step 5: Apply Database Migration

1. **Go to SQL Editor** in your Supabase dashboard
2. **Copy and paste** the contents of `supabase/migrations/20250131_fix_users_schema.sql`
3. **Click Run** to execute the migration

## Step 6: Restart Your Frontend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
cd frontend
npm run dev
```

## Step 7: Test the OAuth Flow

1. **Clear your browser cache** for localhost:3003
2. **Try Google OAuth login again**
3. **Check the browser console** for detailed logs
4. **Watch the callback page** for status updates

## What You Should See

### In Browser Console:
```
Supabase URL: https://your-project-id.supabase.co
Supabase Key (first 20 chars): eyJhbGciOiJIUzI1NiIs...
OAuth callback parameters: {access_token: "...", ...}
Current session: {user: {...}, access_token: "..."}
Redirecting to: /customer
```

### On Callback Page:
- "Processing OAuth callback..."
- "Getting current session..."
- "Processing user data..."
- "Login successful! Redirecting..."

## Common Issues

### Issue 1: "Supabase not configured"
**Solution**: Make sure your `.env` file exists and has the correct values (not placeholder values)

### Issue 2: "No active session found"
**Solution**: 
- Check that the redirect URL is correctly set in Supabase
- Make sure you're using the correct Supabase project
- Verify the OAuth provider (Google) is enabled in Supabase

### Issue 3: "Could not find the 'firstName' column"
**Solution**: Apply the database migration (Step 5 above)

## Quick Test

After setup, you can test if Supabase is working by opening the browser console and running:

```javascript
// This should show your Supabase configuration
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

## Still Having Issues?

If you're still experiencing problems:

1. **Double-check your Supabase credentials** in the `.env` file
2. **Verify the redirect URL** is set correctly in Supabase
3. **Check the Supabase logs** in your project dashboard
4. **Make sure both servers are running** (frontend on 3003, backend on 3001)

The enhanced callback page will now show exactly what's happening and where it's failing!
