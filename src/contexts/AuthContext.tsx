import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import api from '../lib/axios';
import { fetchMe } from '../services/auth.api';
import { getToken, setToken, removeToken } from '../utils/token';
import type { User } from '../types';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const USER_KEY = 'etm_user';

const readStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const writeStoredUser = (u: User) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
};

const clearStoredUser = () => {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
};

// Export so the axios interceptor can call it on 401
export const clearAuthStorage = () => {
  removeToken();
  clearStoredUser();
};

// ─── Context type ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  token?: string | null;
  isLoading: boolean;
  login: (userOrToken: User | string, optionalUser?: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ── Initialise synchronously from cached user ──
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ── Validate session with backend on load ──
  // Checks session via httpOnly cookie with fallback
  useEffect(() => {
    let isMounted = true;

    const validate = async () => {
      try {
        const me = await fetchMe();
        if (isMounted) {
          setUser(me);
          writeStoredUser(me);
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          if (isMounted) {
            clearAuthStorage();
            setUser(null);
            setTokenState(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    validate();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Auth actions ──
  const login = (first: User | string, second?: User) => {
    const userToSet = (typeof first === 'object' ? first : second) as User;
    if (userToSet) {
      writeStoredUser(userToSet);
      setUser(userToSet);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    } finally {
      clearAuthStorage();
      setTokenState(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
