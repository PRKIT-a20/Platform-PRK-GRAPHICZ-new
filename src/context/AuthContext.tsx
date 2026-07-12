import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = storage.get('user');
    if (sessionUser) {
      setUser(sessionUser);
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    storage.set('user', user);
    setUser(user);
  };

  const logout = () => {
    storage.remove('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
