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
    console.log('[AUTH] Login attempt started:', { email, password });
    
    try {
      // First, let's just check if we can query the users table at all
      console.log('[AUTH] Testing Supabase connection...');
      const { data: allUsers, error: countError } = await supabase
        .from('users')
        .select('id, email')
        .limit(5);
      console.log('[AUTH] Sample users in DB:', allUsers, 'Error:', countError);

      // Query the database for user with matching email and password
      console.log('[AUTH] Querying with email:', email, 'password:', password);
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name, role, password_hash')
        .eq('email', email)
        .eq('password_hash', password);

      console.log('[AUTH] Query result:', { users, error, count: users?.length });

      if (error) {
        console.error('[AUTH] Login error from Supabase:', error);
        setIsLoading(false);
        return false;
      }

      if (users && users.length > 0) {
        console.log('[AUTH] User found:', users[0]);
        const userData: User = {
          id: users[0].id,
          email: users[0].email,
          role: users[0].role as UserRole,
          name: users[0].name
        };
        
        // Check for active sanctions before allowing login
        console.log('[AUTH] Checking sanctions for user:', users[0].id);
        const activeSanction = await checkActiveSanctions(users[0].id);
        console.log('[AUTH] Sanction check result:', activeSanction);

        if (activeSanction) {
          if (activeSanction.type === 'ban' || activeSanction.type === 'timeout') {
            console.log('[AUTH] User has active sanction, showing banned page');
            setActiveSanction(activeSanction);
            setIsLoading(false);
            return true;
          }
        }

        console.log('[AUTH] Setting user data and saving to sessionStorage');
        setUser(userData);
        setActiveSanction(null);
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('[AUTH] sessionStorage set:', sessionStorage.getItem('currentUser'));

        // Update last login
        console.log('[AUTH] Updating last_login timestamp');
        const updateResult = await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', users[0].id);
        console.log('[AUTH] Last login update result:', updateResult);

        setIsLoading(false);
        console.log('[AUTH] Login successful, returning true');
        return true;
      }
      
      console.log('[AUTH] No user found with matching credentials');
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

  console.log('[AUTH] Render check - activeSanction:', activeSanction, 'isLoading:', isLoading);
  // If user has active sanction, show banned page
  if (activeSanction && !isLoading) {
    console.log('[AUTH] Rendering BannedPage');
    return <BannedPage sanction={activeSanction} />;
  }
  console.log('[AUTH] Rendering children, user:', user);

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