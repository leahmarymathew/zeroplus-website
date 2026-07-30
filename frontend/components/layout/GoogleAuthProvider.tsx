"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Wrapping in GoogleOAuthProvider loads Google's GSI script — skip it entirely
// until a real client ID exists rather than pointing it at an empty string.
// The login page's own GoogleButton already renders a "not configured" state
// in that case.
export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  if (!CLIENT_ID) return <>{children}</>;
  return <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
