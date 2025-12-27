import { createContext } from "react";
import type { User } from "../interfaces";

interface AuthContextType {
  token: string | null;
  isAuthenticated: () => boolean;
  checkTokenValidity: () => boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ status: number; data: unknown }>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ status: number; data: unknown }>;
  logout: () => void;
  loading: boolean;
  currentUser: User | null;
  fetchUserData: () => Promise<void>;
}

export default createContext<AuthContextType | null>(null);
