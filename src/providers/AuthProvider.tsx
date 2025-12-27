import { useCallback, useEffect, useState } from "react";
import { useCookie, useFetch } from "@/hooks";
import { AUTH_TOKEN_KEY, BACKEND_BASE_URL } from "@/config";
import { AuthContext } from "@/contexts";
import type { Token, User } from "@/interfaces";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tokenCookie, setTokenCookie] = useCookie<Token>(AUTH_TOKEN_KEY, {
    token: null,
    expiresIn: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useCookie<User | null>(
    "user",
    null,
  ) as [User | null, (value: User | null) => void];

  const login = async (email: string, password: string) => {
    const response = await fetch(`${BACKEND_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || response.statusText,
      };
    }

    if (data.token) {
      setTokenCookie({
        token: data.token,
        expiresIn: data.expiresIn,
        createdAt: Date.now(),
      });
      await fetchUserData();
    }
    return { status: response.status, data };
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
  ) => {
    const response = await fetch(`${BACKEND_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || response.statusText,
      };
    }

    if (response.status === 201 && data.token) {
      setTokenCookie({
        token: data.token,
        expiresIn: data.expiresIn,
        createdAt: Date.now(),
      });
      await fetchUserData();
    }
    return { status: response.status, data };
  };

  const logout = () => {
    setTokenCookie({ token: null, expiresIn: 0, createdAt: undefined });
    setCurrentUser(null);
    useFetch.clearCache();
  };

  const fetchUserData = useCallback(async () => {
    if (tokenCookie?.token) {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/users/me`, {
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

  const isAuthenticated = useCallback(() => {
    return !!tokenCookie?.token;
  }, [tokenCookie]);

  const checkTokenValidity = useCallback(() => {
    if (
      tokenCookie?.expiresIn &&
      tokenCookie?.token &&
      tokenCookie?.createdAt
    ) {
      return Date.now() - (tokenCookie.createdAt || 0) < tokenCookie.expiresIn;
    }
    return false;
  }, [tokenCookie]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated()) {
          await fetchUserData();
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        token: tokenCookie?.token || null,
        isAuthenticated,
        checkTokenValidity,
        login,
        register,
        logout,
        loading,
        currentUser,
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
