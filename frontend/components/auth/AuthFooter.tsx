import Link from "next/link";

export function AuthFooter() {
  return (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      By signing in, you agree to our{" "}
      <Link
        href="/terms"
        className="font-medium underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/privacy"
        className="font-medium underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
