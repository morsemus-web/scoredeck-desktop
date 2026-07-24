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

// Web preview runs in a browser (no keychain). Native builds use the OS
// secure storage. Pick a storage adapter that works on whichever platform
// is running right now.
function makeStorage() {
  if (Platform.OS === "web") {
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

  // Lazy-require so the web bundle doesn't try to include the native module.
  const SecureStore = require("expo-secure-store");
  return {
    getItem: (k: string) => SecureStore.getItemAsync(k),
    setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
    removeItem: (k: string) => SecureStore.deleteItemAsync(k),
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: makeStorage() as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
