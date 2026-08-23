import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, getToken, setToken } from "@/lib/api";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      initialized: false,
      init: () => set({ token: getToken(), initialized: true }),
      login: async (email, password) => {
        const res = await api.post<{ access_token: string; user: User }>("/api/auth/login", { email, password });
        setToken(res.access_token);
        set({ user: res.user, token: res.access_token });
      },
      register: async (email, password, full_name) => {
        const res = await api.post<{ access_token: string; user: User }>("/api/auth/register", { email, password, full_name });
        setToken(res.access_token);
        set({ user: res.user, token: res.access_token });
      },
      logout: () => {
        setToken(null);
        set({ user: null, token: null });
      },
    }),
    { name: "nexa-auth", partialize: (s) => ({ user: s.user, token: s.token }) as any }
  )
);