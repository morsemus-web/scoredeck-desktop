import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";

// Supabase magic links open the app via the `scoredeck://` scheme. Nothing in
// supabase-js reads that URL on native (detectSessionInUrl is web-only), so we
// parse it ourselves and establish the session.
//
// Two shapes to handle:
//   PKCE     ->  scoredeck://?code=abc123
//   implicit ->  scoredeck://#access_token=...&refresh_token=...
async function establishSessionFromUrl(url: string): Promise<boolean> {
  try {
    // Query params (PKCE, and error payloads)
    const { queryParams } = Linking.parse(url);
    const code = queryParams?.code as string | undefined;
    const errorDescription = queryParams?.error_description as string | undefined;

    if (errorDescription) {
      console.warn("[auth] link error:", errorDescription);
      return false;
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.warn("[auth] exchangeCodeForSession failed:", error.message);
        return false;
      }
      return true;
    }

    // Hash fragment (implicit flow) — Linking.parse ignores it, so read manually
    const hashIndex = url.indexOf("#");
    if (hashIndex !== -1) {
      const hash = new URLSearchParams(url.slice(hashIndex + 1));
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (error) {
          console.warn("[auth] setSession failed:", error.message);
          return false;
        }
        return true;
      }
    }

    return false;
  } catch (e) {
    console.warn("[auth] deep link parse failed:", e);
    return false;
  }
}

export function useAuthDeepLink(onSignedIn?: () => void) {
  useEffect(() => {
    let mounted = true;

    // Cold start: the link that launched the app
    Linking.getInitialURL().then(async (url) => {
      if (!url || !mounted) return;
      const ok = await establishSessionFromUrl(url);
      if (ok && mounted) onSignedIn?.();
    });

    // Warm start: app already running when the link is tapped
    const sub = Linking.addEventListener("url", async ({ url }) => {
      const ok = await establishSessionFromUrl(url);
      if (ok && mounted) onSignedIn?.();
    });

    return () => {
      mounted = false;
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
