import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const sections = [
  {
    title: "What we collect",
    body: "We collect the account details you provide (name, email), authentication metadata, and the content you process through agents such as prompts, documents, and workflow configurations.",
  },
  {
    title: "How we use data",
    body: "Your data is used to operate the platform: authenticating you, running your agents, improving reliability, and communicating service updates. We do not sell your personal data.",
  },
  {
    title: "Credentials and tokens",
    body: "Passwords are stored only as salted hashes. Session tokens are used to keep you signed in and are never shared with third parties. API keys are stored hashed and shown only once at creation.",
  },
  {
    title: "Third-party processors",
    body: "We rely on infrastructure and model providers to deliver the service. These processors are bound by contractual confidentiality and security obligations.",
  },
  {
    title: "Data retention and deletion",
    body: "You can delete conversations, documents, and your entire workspace from product settings. Deleted data is removed from backups within 30 days.",
  },
  {
    title: "Your rights",
    body: "Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. Contact privacy@nexaagent.app to exercise these rights.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-14 sm:px-8">
      <Link
        href="/login"
        className="mb-10 inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to sign in
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
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
        <a href="mailto:privacy@nexaagent.app" className="font-medium text-primary hover:underline">
          privacy@nexaagent.app
        </a>
        . See also our{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
