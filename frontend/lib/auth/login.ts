import { ApiError, api } from "@/lib/api";
import { setToken } from "@/lib/api";
import { useAuth } from "@/stores/auth";

export type LoginErrorKind = "validation" | "credentials" | "network" | "server";

export class LoginError extends Error {
  kind: LoginErrorKind;
  constructor(kind: LoginErrorKind, message: string) {
    super(message);
    this.name = "LoginError";
    this.kind = kind;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Please enter your password.";
  return null;
}

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

function toLoginError(err: unknown): LoginError {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return new LoginError("credentials", "Invalid email or password. Please try again.");
    }
    if (err.status >= 500) {
      return new LoginError("server", "Something went wrong on our end. Please try again.");
    }
    const detail = err.detail?.message || err.message;
    return new LoginError("credentials", typeof detail === "string" ? detail : "Invalid email or password. Please try again.");
  }
  if (err instanceof TypeError) {
    return new LoginError("network", "Unable to connect. Please check your connection and try again.");
  }
  return new LoginError("server", "Something went wrong on our end. Please try again.");
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  try {
    await useAuth.getState().login(email.trim(), password);
    const user = useAuth.getState().user;
    if (!user) throw new Error("Missing session user after sign-in.");
    return user;
  } catch (err) {
    throw err instanceof LoginError ? err : toLoginError(err);
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await api.post("/api/auth/password-reset", { email: email.trim() });
  } catch {
    // Intentionally swallowed: the confirmation step never reveals whether the
    // account exists. The caller always shows the same generic success state.
  }
}

export function persistSessionToken(token: string) {
  setToken(token);
}
