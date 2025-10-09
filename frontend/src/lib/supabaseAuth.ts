import { supabase, handleSupabaseError, handleSupabaseSuccess } from './supabase'
import { toast } from 'sonner'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "VENDOR" | "CUSTOMER"
  status: string
  avatar?: string
  phone?: string
  vendor?: {
    id: string
    shopname: string
    status: string
  }
  name?: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
}

export class SupabaseAuthService {
  // Sign up new user with email and password (exact specification)
  async signUpWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        console.error('Supabase signup error:', error.message)
        throw error
      }
      
      return data
    } catch (error: any) {
      throw error
    }
  }

  // Create user profile in database
  async createUserProfile(userId: string, userData: RegisterData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          role: userData.role || 'CUSTOMER',
          status: 'ACTIVE',
          password: '' // We don't store password in public table, Supabase Auth handles it
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return handleSupabaseSuccess(this.mapDatabaseUserToUser(data))
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Sign up new user (with additional data)
  async signUp(data: RegisterData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role || 'CUSTOMER'
          }
        }
      })

      if (authError) {
        console.error('Supabase signup error:', authError.message)
        throw authError
      }

      return handleSupabaseSuccess(authData)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Sign in user
  async signIn(email: string, password: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw authError
      }

      if (!authData.user || !authData.session) {
        throw new Error('Failed to sign in')
      }

      // Get user profile from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          vendor:vendors(id, shopname, status)
        `)
        .eq('id', authData.user.id)
        .maybeSingle()

      if (userError) {
        throw userError
      }

      if (!userData) {
        throw new Error('User profile not found')
      }

      return handleSupabaseSuccess({
        user: this.mapDatabaseUserToUser(userData),
        session: authData.session
      })
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      return handleSupabaseSuccess(null)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw authError
      }

      if (!authUser) {
        return handleSupabaseSuccess(null)
      }

      // Get user profile from public.users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          vendor:vendors(id, shopname, status)
        `)
        .eq('id', authUser.id)
        .maybeSingle()

      if (userError) {
        throw userError
      }

      if (!userData) {
        return handleSupabaseSuccess(null)
      }

      return handleSupabaseSuccess(this.mapDatabaseUserToUser(userData))
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }
      return handleSupabaseSuccess(session)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          avatar: updates.avatar
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return handleSupabaseSuccess(this.mapDatabaseUserToUser(data))
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Sign in with Google
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3003/auth/callback'
        }
      })

      if (error) {
        console.error('OAuth error:', error)
        throw error
      }

      return handleSupabaseSuccess(data)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback() {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }

      if (data.session) {
        // Get user profile from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            vendor:vendors(id, shopname, status)
          `)
          .eq('id', data.session.user.id)
          .maybeSingle()

        if (userError) {
          throw userError
        }

        if (!userData) {
          // If user doesn't exist in our users table, create them
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: data.session.user.id,
              email: data.session.user.email || '',
              first_name: data.session.user.user_metadata?.full_name?.split(' ')[0] || 'User',
              last_name: data.session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              role: 'CUSTOMER',
              status: 'ACTIVE',
              password: '', // OAuth users don't have passwords
              avatar: data.session.user.user_metadata?.avatar_url || null
            })
            .select(`
              *,
              vendor:vendors(id, shopname, status)
            `)
            .single()

          if (createError) {
            throw createError
          }

          return handleSupabaseSuccess({
            user: this.mapDatabaseUserToUser(newUser),
            session: data.session
          })
        }

        return handleSupabaseSuccess({
          user: this.mapDatabaseUserToUser(userData),
          session: data.session
        })
      }

      return handleSupabaseSuccess(null)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        throw error
      }

      return handleSupabaseSuccess(null)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      return handleSupabaseSuccess(null)
    } catch (error: any) {
      return handleSupabaseError(error)
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }

  // Helper method to map database user to User interface
  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name || dbUser.firstName,
      lastName: dbUser.last_name || dbUser.lastName,
      role: dbUser.role as "ADMIN" | "MANAGER" | "VENDOR" | "CUSTOMER",
      status: dbUser.status,
      avatar: dbUser.avatar,
      phone: dbUser.phone,
      vendor: dbUser.vendor ? {
        id: dbUser.vendor.id,
        shopname: dbUser.vendor.shopname,
        status: dbUser.vendor.status
      } : undefined,
      name: `${dbUser.first_name || dbUser.firstName} ${dbUser.last_name || dbUser.lastName}`
    }
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService()
