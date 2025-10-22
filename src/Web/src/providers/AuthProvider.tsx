import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { LoginRequest, AuthSession, login as loginRequest } from "../api/auth";
import { authStorage } from "../utils/auth-storage";
import { apiClient } from "../api/client";
import { router } from "../routes";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => authStorage.get());
  const [isRestoring] = useState(false);

  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use((config) => {
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
      return config;
    });

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          authStorage.clear();
          setSession(null);
          router.navigate({ to: "/login" }).catch(() => {
            window.location.href = "/login";
          });
        }
        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [session]);

  const login = async (credentials: LoginRequest) => {
    const newSession = await loginRequest(credentials);
    setSession(newSession);
    authStorage.set(newSession);
    await router.navigate({ to: "/" }).catch(() => {
      window.location.href = "/";
    });
  };

  const logout = () => {
    authStorage.clear();
    setSession(null);
    router.navigate({ to: "/login" }).catch(() => {
      window.location.href = "/login";
    });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isRestoring,
      login,
      logout,
    }),
    [session, isRestoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
