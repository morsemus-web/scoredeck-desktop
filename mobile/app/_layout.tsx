import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/lib/theme";
import { useAuthDeepLink } from "@/lib/useAuthDeepLink";
// Importing for the side effect: defineTask() must run at module scope so the
// OS can find the handler when it wakes the app in the background.
import "@/lib/notifications";

export default function RootLayout() {
  const router = useRouter();

  // Establish a session when a magic link opens the app, then land on the feed.
  useAuthDeepLink(() => router.replace("/"));

  // Kick off font loading in the background but do NOT block rendering on it.
  // On native the font-load promise can silently never resolve, which used to
  // leave the app stuck on a solid teal screen. Icons pop in when the fonts
  // finish; if they never do, everything else still works.
  useFonts({
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="favourites" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="account" />
        <Stack.Screen name="match/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
