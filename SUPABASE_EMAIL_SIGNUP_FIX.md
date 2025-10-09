# ✅ Fix "Email signups are disabled" Error

## 🚨 The Problem
You're getting `AuthApiError: Email signups are disabled` because email signups are disabled in your Supabase project settings.

## 🛠️ The Solution

### Step 1: Enable Email Signups in Supabase

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to Authentication → Settings**
4. **Find "Email" section**
5. **Enable "Enable email confirmations"** (if you want email confirmation)
6. **Enable "Enable email signups"** ✅ **THIS IS THE KEY SETTING**
7. **Save the configuration**

### Step 2: Configure Email Settings (Optional)

If you want email confirmations:

1. **In Authentication → Settings**
2. **Set "Confirm email" to ON**
3. **Configure your email templates** (or use default)
4. **Set redirect URLs** for email confirmation

### Step 3: Test the Fixed Implementation

The code has been updated with the exact specification you requested:

```javascript
// New function in supabaseAuth.ts
async signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) {
    console.error('Supabase signup error:', error.message)
    throw error
  }
  return data
}
```

### Step 4: Verify the Fix

1. **Restart your frontend server**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Try registering a new user**
3. **Check the browser console** - you should no longer see the "Email signups are disabled" error

## 🔧 What Was Fixed in the Code

### 1. Simplified signup function ✅
- Removed complex database operations during signup
- Added proper error logging
- Matches the exact specification you provided

### 2. Added separate functions ✅
- `signUpWithEmail()` - Simple email/password signup
- `createUserProfile()` - Separate function for database operations
- `signUp()` - Enhanced signup with additional data

### 3. Better error handling ✅
- Proper error logging with `console.error()`
- Clear error messages
- Proper error propagation

## 📋 Supabase Settings Checklist

Make sure these are enabled in your Supabase project:

- ✅ **Email signups enabled**
- ✅ **Email provider configured** (if using custom SMTP)
- ✅ **Redirect URLs configured** (if using email confirmation)
- ✅ **Email templates configured** (if using custom templates)

## 🧪 Testing the Fix

### Test 1: Basic Signup
```javascript
// This should work without errors
const result = await supabaseAuth.signUpWithEmail('test@example.com', 'password123');
console.log('Signup result:', result);
```

### Test 2: Full Registration
1. Go to `/register` page
2. Fill out the registration form
3. Submit the form
4. Should see success message (not "Email signups are disabled")

### Test 3: Check Console
- No more `AuthApiError: Email signups are disabled`
- Should see proper success/error messages

## 🚨 Common Issues

### Issue 1: Still getting "Email signups are disabled"
**Solution**: Double-check that "Enable email signups" is turned ON in Supabase Authentication settings

### Issue 2: Email confirmation not working
**Solution**: 
- Check "Enable email confirmations" setting
- Verify redirect URLs are configured
- Check email templates

### Issue 3: Database errors after signup
**Solution**: 
- Apply the database migration from `supabase/migrations/20250131_fix_users_schema.sql`
- Make sure the `users` table exists with correct schema

## 🎯 Expected Results

After enabling email signups in Supabase:

1. ✅ Registration form works without errors
2. ✅ Users can sign up with email/password
3. ✅ No more "Email signups are disabled" error
4. ✅ Proper success/error messages in console
5. ✅ Users are created in Supabase Auth

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Verify Supabase settings** are correctly configured
2. **Check browser console** for detailed error messages
3. **Ensure your `.env` file** has correct Supabase credentials
4. **Restart the dev server** after making changes

The "Email signups are disabled" error will be completely resolved once you enable email signups in your Supabase project settings!
