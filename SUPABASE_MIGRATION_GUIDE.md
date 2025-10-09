# 🚀 Supabase Integration Guide for HOME BONZENGA

## Overview

This guide explains how to migrate your HOME BONZENGA project from the current Express.js + Prisma setup to use Supabase as your backend-as-a-service solution.

## 🔧 What's Been Added

### 1. **Supabase Client Setup**
- `frontend/src/lib/supabase.ts` - Main Supabase client configuration
- `frontend/src/lib/supabaseAuth.ts` - Authentication service wrapper
- `frontend/src/lib/supabaseDatabase.ts` - Database operations service
- `frontend/src/contexts/SupabaseAuthContext.tsx` - React context for auth state

### 2. **Environment Variables**
- `frontend/env.example` - Template for required environment variables

## 🛠️ Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Keep existing variables for backward compatibility
VITE_API_URL=http://localhost:3001/api
```

### Step 3: Migrate Database Schema

You have two options:

#### Option A: Use Existing PostgreSQL Database
If you want to connect Supabase to your existing PostgreSQL database:

1. In Supabase Dashboard → Settings → Database
2. Get your connection string
3. Update your existing database to use Supabase's connection

#### Option B: Migrate Schema to Supabase
1. In Supabase Dashboard → SQL Editor
2. Run your existing Prisma schema as SQL commands
3. Or use the migration SQL from `supabase/migrations/HOMEBONZENGA.sql`

### Step 4: Enable Row Level Security (RLS)

In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for vendors table
CREATE POLICY "Anyone can view approved vendors" ON vendors
  FOR SELECT USING (status = 'APPROVED');

CREATE POLICY "Vendors can manage own data" ON vendors
  FOR ALL USING (auth.uid() = userId);

-- Create policies for services table
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (isActive = true);

CREATE POLICY "Vendors can manage own services" ON services
  FOR ALL USING (
    auth.uid() IN (
      SELECT userId FROM vendors WHERE id = vendorId
    )
  );

-- Create policies for bookings table
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = customerId OR 
    auth.uid() IN (SELECT userId FROM vendors WHERE id = vendorId)
  );

CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customerId);

CREATE POLICY "Vendors can update bookings" ON bookings
  FOR UPDATE USING (
    auth.uid() IN (SELECT userId FROM vendors WHERE id = vendorId)
  );

-- Create policies for addresses table
CREATE POLICY "Users can manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = userId);
```

## 🔄 Migration Options

### Option 1: Gradual Migration (Recommended)

Keep both systems running and gradually migrate features:

1. **Start with Authentication**: Use `SupabaseAuthContext` for new components
2. **Migrate Database Queries**: Replace API calls with Supabase queries
3. **Update Components**: One by one, update components to use Supabase

### Option 2: Complete Migration

Replace the entire system at once:

1. Update `App.tsx` to use `SupabaseAuthProvider`
2. Replace all API calls with Supabase queries
3. Remove Express.js backend (optional)

## 📝 Usage Examples

### Authentication

```tsx
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

function LoginComponent() {
  const { login, isLoading } = useSupabaseAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // User will be redirected automatically
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    // Your login form JSX
  );
}
```

### Database Operations

```tsx
import { supabaseDb } from '@/lib/supabaseDatabase';

function VendorsPage() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const loadVendors = async () => {
      const result = await supabaseDb.getVendors({ status: 'APPROVED' });
      if (result.success) {
        setVendors(result.data);
      }
    };

    loadVendors();
  }, []);

  return (
    // Your vendors list JSX
  );
}
```

### Real-time Updates

```tsx
import { supabaseDb } from '@/lib/supabaseDatabase';

function BookingsPage() {
  const { user } = useSupabaseAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time booking updates
    const channel = supabaseDb.subscribeToBookings(
      (payload) => {
        console.log('Booking updated:', payload);
        // Update local state
        if (payload.eventType === 'INSERT') {
          setBookings(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setBookings(prev => 
            prev.map(booking => 
              booking.id === payload.new.id ? payload.new : booking
            )
          );
        }
      },
      { customerId: user.id }
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    // Your bookings JSX
  );
}
```

## 🔧 Updating App.tsx

To start using Supabase authentication, update your `App.tsx`:

```tsx
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <LanguageProvider>
          <CartProvider>
            {/* Your existing app structure */}
          </CartProvider>
        </LanguageProvider>
      </SupabaseAuthProvider>
    </BrowserRouter>
  );
}
```

## 🚀 Benefits of Supabase Integration

1. **Real-time Updates**: Automatic UI updates when data changes
2. **Built-in Authentication**: Email/password, OAuth, magic links
3. **Row Level Security**: Database-level security policies
4. **Auto-generated APIs**: REST and GraphQL APIs
5. **File Storage**: Built-in file upload and storage
6. **Edge Functions**: Serverless functions for custom logic
7. **Dashboard**: Visual database management
8. **Scaling**: Automatic scaling and backups

## 🔄 Backward Compatibility

The integration is designed to work alongside your existing Express.js backend:

- Keep using your current API for complex business logic
- Use Supabase for CRUD operations and real-time features
- Gradually migrate endpoints as needed

## 🛡️ Security Considerations

1. **Environment Variables**: Never expose your service role key in frontend
2. **Row Level Security**: Always enable RLS on sensitive tables
3. **API Keys**: Use anon key for frontend, service role key for backend only
4. **Policies**: Create specific policies for each user role (ADMIN, VENDOR, CUSTOMER)

## 📚 Next Steps

1. Set up your Supabase project
2. Configure environment variables
3. Run database migrations
4. Update one component at a time
5. Test authentication flow
6. Implement real-time features
7. Optimize performance with proper indexing

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**: Check your Supabase project settings
2. **RLS Blocking Queries**: Verify your security policies
3. **Environment Variables**: Ensure all VITE_ prefixed variables are set
4. **Authentication Loops**: Check session persistence settings

### Getting Help:

- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Discord Community: [discord.supabase.com](https://discord.supabase.com)
- GitHub Issues: Report bugs and get help

---

Happy coding! 🚀
