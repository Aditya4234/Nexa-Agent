"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { initialized, user } = useAuth();

  useEffect(() => {
    if (initialized && user) router.replace("/dashboard");
  }, [initialized, user, router]);

  if (initialized && user) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-background sm:px-6 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[680px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.05] blur-3xl dark:bg-primary/[0.09]"
      />
      <main className="relative z-10 w-full max-w-[420px]">{children}</main>
    </div>
  );
}
