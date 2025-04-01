
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

  // Create profile for a new user
  const createProfile = async (userId: string, userData: Partial<ProfileRow>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'student',
          roll_number: userData.roll_number,
          department: userData.department,
          section: userData.section,
          year: userData.year,
          designation: userData.designation,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Set up auth subscription first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              if (profileError.code === 'PGRST116') {
                // Profile not found, create one
                const userData = {
                  name: session.user.user_metadata.name || '',
                  email: session.user.email || '',
                  role: session.user.user_metadata.role || 'student' as UserRole,
                  roll_number: session.user.user_metadata.rollNumber,
                  department: session.user.user_metadata.department,
                  section: session.user.user_metadata.section,
                  year: session.user.user_metadata.year,
                  designation: session.user.user_metadata.designation,
                };
                
                await createProfile(session.user.id, userData);
                
                // Fetch the profile again
                const { data: newProfile, error: newProfileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (newProfileError) {
                  console.error('Profile fetch error after creation:', newProfileError);
                  setUser(null);
                } else {
                  setUser(profileToUser(newProfile as ProfileRow));
                }
              } else {
                console.error('Profile fetch error:', profileError);
                setUser(null);
              }
            } else {
              setUser(profileToUser(profile as ProfileRow));
            }
          } catch (err) {
            console.error('Error in auth state change:', err);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              if (profileError.code === 'PGRST116') {
                // Profile not found, create one
                const userData = {
                  name: session.user.user_metadata.name || '',
                  email: session.user.email || '',
                  role: session.user.user_metadata.role || 'student' as UserRole,
                  roll_number: session.user.user_metadata.rollNumber,
                  department: session.user.user_metadata.department,
                  section: session.user.user_metadata.section,
                  year: session.user.user_metadata.year,
                  designation: session.user.user_metadata.designation,
                };
                
                await createProfile(session.user.id, userData);
                
                // Fetch the profile again
                const { data: newProfile, error: newProfileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                
                if (newProfileError) {
                  console.error('Profile fetch error after creation:', newProfileError);
                  setUser(null);
                } else {
                  setUser(profileToUser(newProfile as ProfileRow));
                }
              } else {
                console.error('Profile fetch error:', profileError);
                setUser(null);
              }
            } else {
              setUser(profileToUser(profile as ProfileRow));
            }
          } catch (err) {
            console.error('Session check error:', err);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth session error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

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
      
      if (authData.user) {
        // Create a profile for the new user
        await createProfile(authData.user.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          roll_number: data.rollNumber,
          department: data.department,
          section: data.section,
          year: data.year,
          designation: data.designation,
        });
      }
      
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
