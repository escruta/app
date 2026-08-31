import { useCallback, useEffect, useState } from "react";
import { useCookie, useFetch } from "@/hooks";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import { AuthContext } from "@/contexts";
import type { Token, User } from "@/interfaces";

const DEFAULT_SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokenCookie, setTokenCookie] = useCookie<Token>(AUTH_TOKEN_KEY, {
    token: null,
    expiresIn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useCookie<User | null>("user", null);

  const fetchUserData = useCallback(async () => {
    if (tokenCookie?.token) {
      try {
        const response = await fetch(new URL("/users/me", BACKEND_BASE_URL), {
          headers: {
            Authorization: `Bearer ${tokenCookie.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, [tokenCookie?.token, setCurrentUser]);

  const setSessionToken = useCallback(
    async (token: string, expiresIn?: number) => {
      setTokenCookie({
        token,
        expiresIn: expiresIn ?? DEFAULT_SESSION_EXPIRY,
        createdAt: Date.now(),
      });
      await fetchUserData();
    },
    [setTokenCookie, fetchUserData],
  );

  const signOut = useCallback(() => {
    setTokenCookie({ token: null, expiresIn: 0, createdAt: undefined });
    setCurrentUser(null);
    useFetch.clearCache();
  }, [setTokenCookie, setCurrentUser]);

  const isAuthenticated = useCallback(() => !!tokenCookie?.token, [tokenCookie]);

  const checkTokenValidity = useCallback(() => {
    if (tokenCookie?.expiresIn && tokenCookie?.token && tokenCookie?.createdAt) {
      return Date.now() - (tokenCookie.createdAt || 0) < tokenCookie.expiresIn;
    }
    return false;
  }, [tokenCookie]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (tokenCookie?.token) {
          await fetchUserData();
        }
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [tokenCookie?.token, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        token: tokenCookie?.token || null,
        isAuthenticated,
        checkTokenValidity,
        setSessionToken,
        signOut,
        loading,
        currentUser,
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
