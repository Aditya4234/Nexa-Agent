"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LoginError,
  loginWithPassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth/login";
import { SocialAuthError, signInWithProvider, type SocialProvider } from "@/lib/auth/social-auth";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

type FieldErrors = { email?: string; password?: string };

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [pendingProvider, setPendingProvider] = React.useState<SocialProvider | null>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  const busy = isSubmitting || pendingProvider !== null;

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const errors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setFieldErrors(errors);
    setFormError(null);

    if (errors.email) {
      emailRef.current?.focus();
      return;
    }
    if (errors.password) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithPassword(email, password);
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof LoginError
          ? err.message
          : "Unable to connect. Please check your connection and try again.";
      setFormError(message);
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderSignIn(provider: SocialProvider) {
    if (busy) return;
    setFormError(null);
    setPendingProvider(provider);
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setFormError(
        err instanceof SocialAuthError ? err.message : `${provider === "google" ? "Google" : "Apple"} sign-in failed. Please try again.`
      );
    } finally {
      setPendingProvider(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-busy={isSubmitting}>
        {formError && (
          <div
            role="alert"
            className="animate-card-in flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[13px] leading-relaxed text-destructive dark:border-destructive/40"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-[13px] font-medium text-foreground">
            Email address
          </label>
          <input
            id="login-email"
            ref={emailRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            disabled={busy}
            className={cn(
              "flex h-12 w-full rounded-lg border border-input bg-background px-3.5 text-[15px] text-foreground shadow-sm transition-[border-color,box-shadow] duration-200",
              "placeholder:text-muted-foreground/70",
              "hover:border-muted-foreground/40",
              "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
              "disabled:cursor-not-allowed disabled:opacity-60",
              fieldErrors.email && "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20"
            )}
          />
          {fieldErrors.email && (
            <p id="login-email-error" role="alert" className="text-xs font-medium text-destructive">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-[13px] font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              tabIndex={0}
              className="rounded-sm text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            ref={passwordRef}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.form?.requestSubmit();
              }
            }}
            invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            disabled={busy}
          />
          {fieldErrors.password && (
            <p id="login-password-error" role="alert" className="text-xs font-medium text-destructive">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          aria-busy={isSubmitting}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground shadow-md transition-[background-color,box-shadow,transform] duration-200",
            "hover:bg-primary/90 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:pointer-events-none disabled:opacity-70"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
            </>
          )}
        </button>
      </form>

      <AuthDivider>Or continue with</AuthDivider>

      <SocialLoginButtons onProviderSignIn={handleProviderSignIn} disabled={busy} pendingProvider={pendingProvider} />

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="rounded-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
