import { createContext } from "react";
import type { User } from "../interfaces";

interface AuthContextType {
  token: string | null;
  isAuthenticated: () => boolean;
  checkTokenValidity: () => boolean;
  setSessionToken: (token: string, expiresIn?: number) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  currentUser: User | null;
  fetchUserData: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
