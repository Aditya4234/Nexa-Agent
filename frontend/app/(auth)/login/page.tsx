"use client";

import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthFooter } from "@/components/auth/AuthFooter";

export default function LoginPage() {
  return (
    <div className="animate-card-in flex flex-col items-center">
      <div className="mb-7 flex flex-col items-center gap-3.5">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.10),0_12px_32px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] dark:ring-white/10">
          <Image
            src="/logo.png"
            alt="NexaAgent logo"
            fill
            sizes="64px"
            priority
            className="object-cover"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">NexaAgent</h1>
      </div>

      <section
        aria-labelledby="login-heading"
        className="w-full rounded-2xl border border-border/80 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.12)] dark:border-white/[0.06] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_-16px_rgba(0,0,0,0.5)] sm:p-8"
      >
        <header className="mb-6">
          <h2 id="login-heading" className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to NexaAgent
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Welcome back! Sign in to continue to your account.
          </p>
        </header>

        <LoginForm />
      </section>

      <div className="mt-6 max-w-sm px-2 sm:px-0">
        <AuthFooter />
      </div>
    </div>
  );
}
