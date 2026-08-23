import Link from "next/link";
import { Bot } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["Agents", "Workflows", "Tools", "Memory", "Templates"],
  },
  {
    title: "Developers",
    links: ["Documentation", "API", "SDK", "GitHub", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Security", "Contact", "Careers"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                <Bot className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Nexa<span className="text-violet-600">Agent</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Build AI agents that actually get work done. Your AI team, working while you sleep.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2026 NexaAgent. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}