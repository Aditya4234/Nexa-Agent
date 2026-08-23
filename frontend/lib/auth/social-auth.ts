export type SocialProvider = "google" | "apple";

export class SocialAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialAuthError";
  }
}

const PROVIDER_MESSAGES: Record<SocialProvider, string> = {
  google: "Google sign-in failed. Please try again.",
  apple: "Apple sign-in failed. Please try again.",
};

function authorizeUrl(provider: SocialProvider): string | null {
  if (provider === "google") return process.env.NEXT_PUBLIC_OAUTH_GOOGLE_URL || null;
  return process.env.NEXT_PUBLIC_OAUTH_APPLE_URL || null;
}

export async function signInWithProvider(provider: SocialProvider): Promise<void> {
  const url = authorizeUrl(provider);
  if (!url) {
    // OAuth is not configured for this environment yet; surface the failure
    // through the normal error path instead of a broken redirect.
    throw new SocialAuthError(PROVIDER_MESSAGES[provider]);
  }
  window.location.assign(url);
}
