import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const [status, setStatus] = useState('Processing OAuth callback...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setStatus('Finishing sign in...');
        
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
          throw new Error('Supabase not configured. Please set up your environment variables.');
        }
        
        // Get the current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }

        if (session) {
          setStatus('Login successful! Redirecting...');
          toast.success("Login successful!");
          
          // Redirect to appropriate dashboard based on user role
          const dashboardPath = getDashboardPath(session.user.user_metadata?.role || 'CUSTOMER');
          console.log('Redirecting to:', dashboardPath);
          navigate(dashboardPath);
        } else {
          throw new Error('No active session found. Please try logging in again.');
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        const errorMessage = error.message || 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(`Login failed: ${errorMessage}`);
        
        // Wait a bit before redirecting to show the error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  const getDashboardPath = (userRole?: string) => {
    const role = userRole || user?.role;
    if (!role) return '/';
    
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'MANAGER':
        return '/manager';
      case 'VENDOR':
        return '/vendor';
      case 'CUSTOMER':
      default:
        return '/customer';
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6f0] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-foreground mb-2">{status}</p>
            <p className="text-sm text-muted-foreground">Please wait while we complete your login...</p>
          </>
        ) : (
          <>
            <div className="rounded-full h-32 w-32 bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-red-600 mb-2">Login Failed</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <p className="text-xs text-muted-foreground">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
