import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const SUPABASE_URL = extra.supabaseUrl ?? "";
const SUPABASE_ANON = extra.supabaseAnonKey ?? "";

// Android SecureStore rejects values over 2048 bytes, and a Supabase session
// (access JWT + refresh token + user object) blows past that — which silently
// broke session persistence. Split the value into chunks and store a small
// manifest under the original key.
const CHUNK_SIZE = 1800;

function makeSecureStorage() {
  const SecureStore = require("expo-secure-store");

  return {
    async getItem(key: string): Promise<string | null> {
      const head = await SecureStore.getItemAsync(key);
      if (head === null) return null;
      if (!head.startsWith("__chunks__:")) return head;

      const count = parseInt(head.slice("__chunks__:".length), 10);
      if (!Number.isFinite(count)) return null;

      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const part = await SecureStore.getItemAsync(`${key}__${i}`);
        if (part === null) return null; // torn write — treat as signed out
        parts.push(part);
      }
      return parts.join("");
    },

    async setItem(key: string, value: string): Promise<void> {
      // Clear any previous chunks so a shorter value can't leave orphans behind
      await this.removeItem(key);

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        return;
      }

      const count = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < count; i++) {
        await SecureStore.setItemAsync(
          `${key}__${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        );
      }
      await SecureStore.setItemAsync(key, `__chunks__:${count}`);
    },

    async removeItem(key: string): Promise<void> {
      const head = await SecureStore.getItemAsync(key);
      if (head?.startsWith("__chunks__:")) {
        const count = parseInt(head.slice("__chunks__:".length), 10);
        if (Number.isFinite(count)) {
          for (let i = 0; i < count; i++) {
            await SecureStore.deleteItemAsync(`${key}__${i}`);
          }
        }
      }
      await SecureStore.deleteItemAsync(key);
    },
  };
}

function makeWebStorage() {
  // Guard against SSR (Metro pre-renders during build) where window is undefined.
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      getItem: async (_k: string) => null,
      setItem: async (_k: string, _v: string) => {},
      removeItem: async (_k: string) => {},
    };
  }
  return {
    getItem: async (k: string) => window.localStorage.getItem(k),
    setItem: async (k: string, v: string) => window.localStorage.setItem(k, v),
    removeItem: async (k: string) => window.localStorage.removeItem(k),
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: (Platform.OS === "web" ? makeWebStorage() : makeSecureStorage()) as any,
    autoRefreshToken: true,
    persistSession: true,
    // Web can read the callback straight off the URL. On native the OS hands
    // us the deep link instead — see useAuthDeepLink().
    detectSessionInUrl: Platform.OS === "web",
    // PKCE gives us a deterministic ?code= param to exchange, which is far
    // easier to handle over a deep link than implicit-flow hash fragments.
    flowType: "pkce",
  },
});
