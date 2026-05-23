import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
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
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch { /* ignore */ }
};

const clearStoredUser = () => {
  try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
};

// Export so the axios interceptor can call it on 401
export const clearAuthStorage = () => {
  removeToken();
  clearStoredUser();
};

// ─── Context type ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // ── Initialise synchronously from localStorage ──
  // If the user was previously logged in, restore immediately without waiting
  // for any async API call — this prevents the "flash to login" on refresh.
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setTokenState] = useState<string | null>(() => getToken());

  // isLoading = true only when we have a saved token but no cached user
  // (rare edge case: token saved but localStorage cleared separately)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const hasToken = !!getToken();
    const hasCachedUser = !!readStoredUser();
    // Need to hit the API only when token exists but user isn't cached yet
    return hasToken && !hasCachedUser;
  });

  // ── Background token validation ──
  // Validates the saved token with the server WITHOUT blocking the UI.
  // Only logs the user out when the server explicitly says the token is invalid (401).
  // Network errors, 404s, or 5xx responses keep the cached session alive.
  useEffect(() => {
    const validate = async () => {
      const savedToken = getToken();

      // No token → user is definitely logged out
      if (!savedToken) {
        setUser(null);
        setTokenState(null);
        clearStoredUser();
        setIsLoading(false);
        return;
      }

      try {
        const me = await fetchMe();
        // Token is valid — update user data with the latest from the server
        setUser(me);
        setTokenState(savedToken);
        writeStoredUser(me);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          // Token is expired or invalid — force logout
          clearAuthStorage();
          setUser(null);
          setTokenState(null);
        }
        // For all other errors (network down, backend 404/500, etc.)
        // keep the cached user so the app stays usable
      } finally {
        setIsLoading(false);
      }
    };

    validate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth actions ──
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    writeStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuthStorage();
    setTokenState(null);
    setUser(null);
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
