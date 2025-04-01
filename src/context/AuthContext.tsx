
import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@/types";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User> & { password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Mock user data for development
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    name: "John Instructor",
    email: "instructor@example.com",
    password: "password123",
    role: "instructor",
    designation: "Assistant Professor",
    createdAt: new Date(),
  },
  {
    id: "2",
    name: "Jane Student",
    email: "student@example.com",
    password: "password123",
    role: "student",
    rollNumber: "CS2001",
    department: "Computer Science",
    section: "A",
    year: "2",
    createdAt: new Date(),
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("gdUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Mock login - would be replaced with actual API call
      const user = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Remove password before storing user
      const { password: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      localStorage.setItem("gdUser", JSON.stringify(userWithoutPassword));
      
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User> & { password: string }) => {
    setIsLoading(true);
    
    try {
      // Mock registration - would be replaced with actual API call
      const existingUser = MOCK_USERS.find(
        (u) => u.email === userData.email
      );

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: userData.name || "",
        email: userData.email || "",
        role: userData.role as UserRole,
        department: userData.department,
        section: userData.section,
        year: userData.year,
        rollNumber: userData.rollNumber,
        designation: userData.designation,
        createdAt: new Date(),
      };

      // Remove password before storing user
      setUser(newUser);
      localStorage.setItem("gdUser", JSON.stringify(newUser));
      
      // In a real app, you would add the user to the database here
      
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gdUser");
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      // Mock profile update - would be replaced with actual API call
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("gdUser", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
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
