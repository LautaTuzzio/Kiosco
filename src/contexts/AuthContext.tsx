import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = sessionStorage.getItem('currentUser');
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Query the database for user with matching email and password
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', email)
        .eq('password_hash', password); // In production, this should be properly hashed

      if (error) {
        console.error('Login error:', error);
        setIsLoading(false);
        return false;
      }

      if (users && users.length > 0) {
        const userData: User = {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role as UserRole,
          name: users[0].name
        };
        
        setUser(userData);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', users[0].id);
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email);

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        setIsLoading(false);
        return false;
      }

      if (existingUsers && existingUsers.length > 0) {
        console.error('Email already exists');
        setIsLoading(false);
        return false;
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            password_hash: userData.password, // In production, hash this properly
            role: userData.role,
            name: userData.name,
            phone: userData.phone || null,
            address: userData.address || null,
            birth_date: userData.birthDate || null,
            course: userData.course || null,
            emergency_contact: userData.emergencyContact || null,
            is_active: true
          }
        ])
        .select('id, email, name, role')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        setIsLoading(false);
        return false;
      }

      if (newUser) {
        const userObj: User = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role as UserRole,
          name: newUser.name
        };
        
        setUser(userObj);
        sessionStorage.setItem('currentUser', JSON.stringify(userObj));
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};