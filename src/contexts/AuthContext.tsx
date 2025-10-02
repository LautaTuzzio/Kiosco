import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { BannedPage } from '../components/auth/BannedPage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSanction, setActiveSanction] = useState<any>(null);

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

  const checkActiveSanctions = async (userId: string) => {
    try {
      const { data: sanctions, error } = await supabase
        .from('sanctions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking sanctions:', error);
        return null;
      }

      return sanctions && sanctions.length > 0 ? sanctions[0] : null;
    } catch (error) {
      console.error('Error checking sanctions:', error);
      return null;
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
        
        // Check for active sanctions before allowing login
        const activeSanction = await checkActiveSanctions(users[0].id);

        if (activeSanction) {
          if (activeSanction.type === 'ban' || activeSanction.type === 'timeout') {
            setActiveSanction(activeSanction);
            setIsLoading(false);
            return true;
          }
        }

        setUser(userData);
        setActiveSanction(null);
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

  const logout = () => {
    setUser(null);
    setActiveSanction(null);
    sessionStorage.removeItem('currentUser');
  };

  // If user has active sanction, show banned page
  if (activeSanction && !isLoading) {
    return <BannedPage sanction={activeSanction} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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