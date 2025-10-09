import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabaseAuth, User, RegisterData } from "@/lib/supabaseAuth";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  handleSignup: (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  redirectToDashboard: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const sessionResult = await supabaseAuth.getCurrentSession();
        if (sessionResult.success && 'data' in sessionResult && sessionResult.data) {
          const userResult = await supabaseAuth.getCurrentUser();
          if (userResult.success && 'data' in userResult && userResult.data) {
            setUser(userResult.data);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          const userResult = await supabaseAuth.getCurrentUser();
          if (userResult.success && 'data' in userResult && userResult.data) {
            setUser(userResult.data);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Optionally refresh user data when token is refreshed
          const userResult = await supabaseAuth.getCurrentUser();
          if (userResult.success && 'data' in userResult && userResult.data) {
            setUser(userResult.data);
          }
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signIn(email, password);
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Login failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ('data' in result && result.data) {
        setUser(result.data.user);
        toast.success("Login successful");
        
        // Redirect to appropriate dashboard
        const dashboardPath = getDashboardPath(result.data.user.role);
        navigate(dashboardPath);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signInWithGoogle();
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Google login failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Google OAuth will redirect to the callback URL
      // The actual login handling will be done in the callback
    } catch (err: any) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signUp(data);
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Registration failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // Check if email confirmation is required
      if ('data' in result && result.data) {
        if (result.data.session) {
          setUser(result.data.user);
          toast.success("Registration successful");
          const dashboardPath = getDashboardPath(result.data.user.role);
          navigate(dashboardPath);
        } else {
          toast.success("Registration successful! Please check your email to confirm your account.");
          navigate('/login');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (provider: 'google' | 'email', email?: string, password?: string, userData?: RegisterData) => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        // Handle Google OAuth signup
        const result = await supabaseAuth.signInWithGoogle();
        
        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Google signup failed";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Google OAuth will redirect to the callback URL
        // The actual signup handling will be done in the callback
        toast.success("Redirecting to Google...");
      } else {
        // Handle email/password signup
        if (!email || !password || !userData) {
          throw new Error("Email, password, and user data are required for email signup");
        }

        const result = await supabaseAuth.signUp(userData);
        
        if (!result.success) {
          const errorMessage = 'error' in result ? result.error : "Registration failed";
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Check if email confirmation is required
        if ('data' in result && result.data) {
          if (result.data.session) {
            setUser(result.data.user);
            toast.success("Registration successful");
            const dashboardPath = getDashboardPath(result.data.user.role);
            navigate(dashboardPath);
          } else {
            toast.success("Registration successful! Please check your email to confirm your account.");
            navigate('/login');
          }
        }
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.signOut();
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Logout failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      setUser(null);
      toast.success("Logged out successfully");
      navigate('/');
    } catch (err: any) {
      console.error('Logout error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const userResult = await supabaseAuth.getCurrentUser();
      if (userResult.success && 'data' in userResult && userResult.data) {
        setUser(userResult.data);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Refresh token error:', err);
      setUser(null);
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setIsLoading(true);
    try {
      const result = await supabaseAuth.updateProfile(user.id, updates);
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Profile update failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if ('data' in result && result.data) {
        setUser(result.data);
        toast.success("Profile updated successfully");
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      const result = await supabaseAuth.resetPassword(email);
      
      if (!result.success) {
        const errorMessage = 'error' in result ? result.error : "Password reset failed";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

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

  const redirectToDashboard = () => {
    const dashboardPath = getDashboardPath();
    navigate(dashboardPath);
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        handleSignup,
        logout,
        refreshToken,
        redirectToDashboard,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): AuthContextType => {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  return ctx;
};
