import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

const sections = [
  {
    title: "1. Acceptance of terms",
    body: "By accessing or using NexaAgent, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the platform.",
  },
  {
    title: "2. Your account",
    body: "You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use.",
  },
  {
    title: "3. Acceptable use",
    body: "You may use NexaAgent only for lawful purposes. You may not attempt to disrupt the service, access other users' data, or use the platform to build products that violate applicable law.",
  },
  {
    title: "4. AI-generated content",
    body: "Agent outputs may be inaccurate or incomplete. You are responsible for reviewing agent actions and outputs before relying on them in production workflows.",
  },
  {
    title: "5. Termination",
    body: "We may suspend or terminate accounts that violate these terms. You may stop using NexaAgent at any time and request deletion of your data.",
  },
  {
    title: "6. Changes to these terms",
    body: "We may update these terms from time to time. Material changes will be communicated through the product or by email before they take effect.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-14 sm:px-8">
      <Link
        href="/login"
        className="mb-10 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to sign in
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

      <div className="mt-8 flex flex-col gap-7">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        Questions? Contact us at{" "}
        <a href="mailto:legal@nexaagent.app" className="font-medium text-primary hover:underline">
          legal@nexaagent.app
        </a>
        . See also our{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
