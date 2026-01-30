import { createContext } from "react";
import type { User } from "../interfaces";

interface AuthContextType {
  token: string | null;
  isAuthenticated: () => boolean;
  checkTokenValidity: () => boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ status: number; data: unknown }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ status: number; data: unknown }>;
  signOut: () => void;
  loading: boolean;
  currentUser: User | null;
  fetchUserData: () => Promise<void>;
}

export default createContext<AuthContextType | null>(null);
