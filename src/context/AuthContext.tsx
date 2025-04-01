
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileRow, UserRole } from "@/types/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  section?: string;
  year?: string;
  rollNumber?: string;
  designation?: string;
  createdAt: Date;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  rollNumber?: string;
  department?: string;
  section?: string;
  year?: string;
  designation?: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  rollNumber?: string;
  department?: string;
  section?: string;
  year?: string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert ProfileRow to User
  const profileToUser = (profile: ProfileRow): User => {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      department: profile.department || undefined,
      section: profile.section || undefined,
      year: profile.year || undefined,
      rollNumber: profile.roll_number || undefined,
      designation: profile.designation || undefined,
      createdAt: new Date(profile.created_at),
    };
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) throw profileError;
          
          setUser(profileToUser(profile as ProfileRow));
        }
      } catch (error) {
        console.error('Auth session error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
            setUser(null);
          } else {
            setUser(profileToUser(profile as ProfileRow));
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // The onAuthStateChange listener will update the user
    } catch (error: any) {
      throw new Error(error.message || 'Failed to log in');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
            rollNumber: data.rollNumber,
            department: data.department,
            section: data.section,
            year: data.year,
            designation: data.designation,
          },
        },
      });

      if (error) throw error;
      
      // The onAuthStateChange listener will update the user
    } catch (error: any) {
      throw new Error(error.message || 'Failed to register');
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      if (!user) throw new Error('No user is logged in');

      const updates = {
        name: data.name,
        email: data.email,
        roll_number: data.rollNumber,
        department: data.department,
        section: data.section,
        year: data.year,
        designation: data.designation,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        rollNumber: data.rollNumber || prev.rollNumber,
        department: data.department || prev.department,
        section: data.section || prev.section,
        year: data.year || prev.year,
        designation: data.designation || prev.designation,
      } : null);

    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // The onAuthStateChange listener will update the user
    } catch (error: any) {
      throw new Error(error.message || 'Failed to log out');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
