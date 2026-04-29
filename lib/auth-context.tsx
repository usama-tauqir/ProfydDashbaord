"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import type { User, Department, Role } from "./types"
import type { User as SupabaseUser, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: SignUpData) => Promise<{
  user: SupabaseUser | null
  session: Session | null
}>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  companyName: string
  firstName: string
  middleName?: string
  lastName: string
  department: Department | "teachers"
  role: Role | "teacher"
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to ensure user exists in database
  const ensureUserInDatabase = useCallback(async (authUser: SupabaseUser): Promise<boolean> => {
    try {
      console.log('💾 Ensuring user exists in database:', authUser.email);
      
      const { error } = await supabase
  .from("users")
  .upsert({
    id: authUser.id,
    email: authUser.email || "",
    company_name: authUser.user_metadata?.company_name || "",
    first_name: authUser.user_metadata?.first_name || "",
    last_name: authUser.user_metadata?.last_name || "",
    department: authUser.user_metadata?.department || "support",
    role: authUser.user_metadata?.role || "staff",
    phone: authUser.user_metadata?.phone || null,
  }, { onConflict: "id" })

      if (error) {
        console.error('❌ Failed to ensure user in database:', error);
        return false;
      }

      console.log('✅ User ensured in database');
      return true;
    } catch (err) {
      console.error('❌ Error ensuring user in database:', err);
      return false;
    }
  }, []);

  // Simplified fetch user data
  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Fetching user data for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Database error:', JSON.stringify(error, null, 2));
        
        // If table doesn't exist, we need to create it
        if (error.code === 'PGRST205') {
          console.error('❌ Users table does not exist! Please run the SQL migration.');
          return null;
        }
        
        return null;
      }
      
      if (!data) {
        console.log('⚠️ User not found in database, attempting to create...');
        
        // Try to create the user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const success = await ensureUserInDatabase(authUser);
          if (success) {
            // Fetch again
            return fetchUserData(userId);
          }
        }
        
        return null;
      }
      
      console.log('✅ User data found:', data.email);
      
      const transformedUser: User = {
        id: data.id,
        email: data.email,
        companyName: data.company_name,
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        department: data.department as Department,
        role: data.role as Role,
        createdAt: new Date(data.created_at)
      };
      
      return transformedUser;
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      return null;
    }
  }, [ensureUserInDatabase]);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log('📡 Getting initial session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          return;
        }
        
        console.log('📡 Session:', session ? 'Found' : 'Not found');
        if (session) {
          console.log('📡 Session expires:', new Date(session.expires_at! * 1000).toLocaleString());
        }
        
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          // Try to fetch user data
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        console.log('🔄 Session expires:', session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A');
        
        // Only update state if it's not already set (to avoid conflicts with manual signIn/signOut)
        if (event === 'SIGNED_IN' && session?.user && !supabaseUser) {
          setSupabaseUser(session.user);
          await ensureUserInDatabase(session.user);
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data on token refresh
          const userData = await fetchUserData(session.user.id);
          setUser(userData);
        }
        
        // Only refresh router for certain events, not for every state change
        if (event === 'SIGNED_OUT') {
          router.refresh();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, fetchUserData, ensureUserInDatabase]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('🔑 Signing in...', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ Sign in successful, session expires:', 
        data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A');
      
      // Immediately update state with the session data
      setSupabaseUser(data.user);
      if (data.user) {
        await ensureUserInDatabase(data.user);
        const userData = await fetchUserData(data.user.id);
        setUser(userData);
      }
      
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [ensureUserInDatabase, fetchUserData]);

  const signUp = useCallback(async (userData: SignUpData) => {
  setIsLoading(true)
  try {
    console.log("📝 Signing up...", userData.email)

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          company_name: userData.companyName,
          department: userData.department,
          role: userData.role,
          phone: userData.phone || null,
        },
      },
    })

    if (error) throw error

    console.log("✅ Sign up successful")

    return {
      user: data.user,
      session: data.session,
    }
  } catch (error) {
    console.error("❌ Sign up error:", error)
    throw error
  } finally {
    setIsLoading(false)
  }
}, [])
  const signOut = useCallback(async () => {
    try {
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Immediately clear the user state
      setUser(null);
      setSupabaseUser(null);
      
      router.push("/sign-in");
      // Remove router.refresh() as it might cause issues
    } catch (error) {
      console.error("❌ Sign out error:", error);
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('❌ Update password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        supabaseUser,
        isLoading, 
        signIn, 
        signUp, 
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}