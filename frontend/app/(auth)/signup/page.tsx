"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/stores/auth";
import { ApiError } from "@/lib/api";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthFooter } from "@/components/auth/AuthFooter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignUpPage() {
  const router = useRouter();
  const register = useAuth((s) => s.register);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<{ fullName?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);

  function clearFieldError(field: keyof typeof fieldErrors) {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const errors: typeof fieldErrors = {
      fullName: fullName.trim() ? undefined : "Please enter your full name.",
      email: !email.trim()
        ? "Please enter your email address."
        : !EMAIL_PATTERN.test(email.trim())
          ? "Please enter a valid email address."
          : undefined,
      password: password.length < 8 ? "Password must be at least 8 characters." : undefined,
    };
    setFieldErrors(errors);
    setFormError(null);

    if (errors.fullName) return;
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
      await register(email.trim(), password, fullName.trim());
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError("An account with this email already exists. Try signing in instead.");
      } else if (err instanceof TypeError || !(err instanceof ApiError)) {
        setFormError("Unable to connect. Please check your connection and try again.");
      } else {
        setFormError(err.detail?.message || "Something went wrong on our end. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = (invalid?: string) =>
    cn(
      "flex h-12 w-full rounded-lg border border-input bg-background px-3.5 text-[15px] text-foreground shadow-sm transition-[border-color,box-shadow] duration-200",
      "placeholder:text-muted-foreground/70",
      "hover:border-muted-foreground/40",
      "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25",
      "disabled:cursor-not-allowed disabled:opacity-60",
      invalid && "border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20"
    );

  return (
    <div className="animate-card-in flex flex-col items-center">
      <div className="mb-7 flex flex-col items-center gap-3.5">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.10),0_12px_32px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] dark:ring-white/10">
          <Image src="/logo.png" alt="NexaAgent logo" fill sizes="64px" priority className="object-cover" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">NexaAgent</h1>
      </div>

      <section
        aria-labelledby="signup-heading"
        className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.12)] dark:border-white/[0.06] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8"
      >
        <header className="mb-6">
          <h2 id="signup-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Start building autonomous agents in minutes.
          </p>
        </header>

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
            <label htmlFor="signup-name" className="text-[13px] font-medium text-foreground">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              aria-invalid={fieldErrors.fullName ? true : undefined}
              disabled={isSubmitting}
              className={inputClass(fieldErrors.fullName)}
            />
            {fieldErrors.fullName && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-email" className="text-[13px] font-medium text-foreground">
              Email address
            </label>
            <input
              id="signup-email"
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
              disabled={isSubmitting}
              className={inputClass(fieldErrors.email)}
            />
            {fieldErrors.email && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="signup-password" className="text-[13px] font-medium text-foreground">
              Password
            </label>
            <PasswordInput
              id="signup-password"
              ref={passwordRef}
              name="new-password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              invalid={Boolean(fieldErrors.password)}
              disabled={isSubmitting}
            />
            {fieldErrors.password ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
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
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="rounded-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </p>
      </section>

      <div className="mt-6 max-w-sm px-2 sm:px-0">
        <AuthFooter />
      </div>
    </div>
  );
}
