import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredAdminUser, AppUser } from './auth';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(() => getStoredAdminUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial check from stored session
    const stored = getStoredAdminUser();
    setUser(stored);
    setLoading(false);

    const handleAuthEvent = () => {
      const activeStored = getStoredAdminUser();
      setUser(activeStored);
      setLoading(false);
    };

    window.addEventListener("quotient_auth_changed", handleAuthEvent);
    return () => {
      window.removeEventListener("quotient_auth_changed", handleAuthEvent);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


