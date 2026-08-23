"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { validateEmail, requestPasswordReset } from "@/lib/auth/login";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const error = validateEmail(email);
    setFieldError(error);
    if (error) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="animate-card-in flex flex-col items-center">
      <div className="mb-7 flex flex-col items-center gap-3.5">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.10),0_12px_32px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] dark:ring-white/10">
          <Image src="/logo.png" alt="NexaAgent logo" fill sizes="64px" priority className="object-cover" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">NexaAgent</h1>
      </div>

      <section
        aria-labelledby="forgot-heading"
        className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.12)] dark:border-white/[0.06] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8"
      >
        {submitted ? (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" aria-hidden />
            </div>
            <h2 id="forgot-heading" className="text-xl font-semibold tracking-tight text-foreground">
              Check your inbox
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>, we&apos;ve
              sent a link to reset your password.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-6">
              <h2 id="forgot-heading" className="text-2xl font-semibold tracking-tight text-foreground">
                Reset your password
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Enter the email address linked to your account and we&apos;ll send you a reset link.
              </p>
            </header>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-busy={isSubmitting}>
              {fieldError && (
                <div
                  role="alert"
                  className="animate-card-in flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-[13px] leading-relaxed text-destructive dark:border-destructive/40"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>{fieldError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="forgot-email" className="text-[13px] font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="forgot-email"
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
                    if (fieldError) setFieldError(null);
                  }}
                  aria-invalid={fieldError ? true : undefined}
                  disabled={isSubmitting}
                  className={
                    "flex h-12 w-full rounded-lg border border-input bg-background px-3.5 text-[15px] text-foreground shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60" +
                    (fieldError ? " border-destructive/70 focus-visible:border-destructive focus-visible:ring-destructive/20" : "")
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground shadow-md transition-[background-color,box-shadow,transform] duration-200 hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Sending…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
