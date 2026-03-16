import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { set401Interceptor } from '../lib/api';

const TOKEN_KEY = 'maxplus_token_v1';
const USER_KEY  = 'maxplus_user_v1';

const AuthCtx = createContext(null);

function loadAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user  = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(loadAuth);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    set401Interceptor(() => {
      setIsSessionExpired(true);
    });
  }, []);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setAuth({ token: newToken, user: newUser });
    setIsSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth({ token: null, user: null });
    setIsSessionExpired(false);
  }, []);

  return (
    <AuthCtx.Provider value={{ 
      isAuthenticated: !!token, 
      token, 
      user, 
      login, 
      logout,
      isSessionExpired,
      setIsSessionExpired
    }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuthContext = () => useContext(AuthCtx);
