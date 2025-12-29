"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { Employee, AuthState } from "@/types";
import authApi from "@/lib/auth-api";
import { getAuthToken } from "@/lib/api-client";

interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    employee: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();

      if (token) {
        try {
          const employee = await authApi.getProfile();
          setState({
            isAuthenticated: true,
            employee,
            token,
          });
        } catch (error) {
          // Token is invalid, clear it
          authApi.logout();
          setState({
            isAuthenticated: false,
            employee: null,
            token: null,
          });
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const response = await authApi.login({ usernameOrEmail, password });

      setState({
        isAuthenticated: true,
        employee: response.employee,
        token: response.accessToken,
      });

      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    authApi.logout();
    setState({
      isAuthenticated: false,
      employee: null,
      token: null,
    });
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
