# 🔧 Complete Supabase Environment Setup Guide

## **Required Environment Variables**

Create a `.env` file in the `frontend` directory with the following variables:

```bash
# ==================== SUPABASE CONFIGURATION ====================
# Get these from your Supabase project dashboard
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# ==================== AUTHENTICATION ====================
# OAuth redirect URLs (update these with your actual domain)
VITE_OAUTH_REDIRECT_URL=http://localhost:3003/auth/callback

# ==================== PAYMENT GATEWAYS ====================
# Stripe (for card payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Razorpay (for UPI/Wallet payments)
VITE_RAZORPAY_KEY_ID=rzp_test_...

# ==================== LOCATION SERVICES ====================
# Google Maps API (for location features)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# ==================== APP CONFIGURATION ====================
VITE_APP_NAME=HOME BONZENGA
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# ==================== BACKEND API (Optional) ====================
# Only needed if you're using the Node.js backend alongside Supabase
VITE_API_URL=http://localhost:3001/api
```

## **How to Get Supabase Credentials**

### 1. **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project name: "HOME BONZENGA"
6. Set a strong database password
7. Choose a region close to your users
8. Click "Create new project"

### 2. **Get Project URL and API Key**
1. Go to your project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. **Configure Authentication**
1. Go to "Authentication" → "Settings"
2. Set **Site URL**: `http://localhost:3003` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3003/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)
4. Enable **Email signups** if you want email/password registration
5. Configure **Google OAuth**:
   - Go to "Authentication" → "Providers"
   - Enable Google provider
   - Add your Google OAuth credentials

### 4. **Apply Database Migration**
1. Go to "SQL Editor" in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20250131_complete_schema.sql`
3. Paste and run the SQL script
4. Verify all tables are created successfully

## **Environment Variable Validation**

The app will automatically validate your environment variables on startup. If any are missing or incorrect, you'll see error messages in the console.

### **Validation Checks:**
- ✅ Supabase URL is properly formatted
- ✅ Supabase anon key is present
- ✅ OAuth redirect URL is configured
- ✅ Payment gateway keys are present (if using payments)

## **Development vs Production**

### **Development (.env)**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OAUTH_REDIRECT_URL=http://localhost:3003/auth/callback
VITE_APP_ENV=development
```

### **Production (.env.production)**
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OAUTH_REDIRECT_URL=https://yourdomain.com/auth/callback
VITE_APP_ENV=production
```

## **Security Best Practices**

### **1. Never Commit .env Files**
Add to your `.gitignore`:
```
.env
.env.local
.env.production
```

### **2. Use Different Projects for Dev/Prod**
- Create separate Supabase projects for development and production
- Use different API keys for each environment
- Never use production keys in development

### **3. Rotate Keys Regularly**
- Regularly rotate your Supabase API keys
- Update environment variables when keys change
- Monitor for any unauthorized usage

## **Troubleshooting**

### **Common Issues:**

#### **1. "Supabase not configured" Error**
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Ensure the URL doesn't contain `your-project-id`
- Restart your development server after updating `.env`

#### **2. OAuth Redirect Loop**
- Verify `VITE_OAUTH_REDIRECT_URL` matches your Supabase redirect URLs
- Check that the URL is exactly: `http://localhost:3003/auth/callback`
- Ensure no trailing slashes or extra characters

#### **3. Database Connection Errors**
- Verify your Supabase project is active
- Check that the database migration has been applied
- Ensure RLS policies are properly configured

#### **4. Authentication Errors**
- Verify Google OAuth is properly configured in Supabase
- Check that email signups are enabled (if using email/password)
- Ensure user roles are properly set in the database

## **Testing Your Setup**

### **1. Test Supabase Connection**
```bash
# Start your development server
npm run dev

# Check browser console for connection status
# Should see: "✅ Supabase connection successful!"
```

### **2. Test Authentication**
1. Go to `/login`
2. Try Google login
3. Try email registration (if enabled)
4. Verify redirect to appropriate dashboard

### **3. Test Database Operations**
1. Create a test user
2. Try creating a vendor profile
3. Test CRUD operations
4. Verify RLS policies are working

## **Next Steps**

After setting up your environment:

1. **Apply the database migration** using the SQL script
2. **Configure OAuth providers** in Supabase dashboard
3. **Test authentication flows** with different user roles
4. **Verify CRUD operations** work correctly
5. **Set up payment gateways** (if needed)
6. **Configure production environment** for deployment

## **Support**

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase project is active and accessible
4. Check that database migration was applied successfully
5. Verify OAuth configuration in Supabase dashboard

**Your Supabase setup should now be complete and ready for development!** 🎉
