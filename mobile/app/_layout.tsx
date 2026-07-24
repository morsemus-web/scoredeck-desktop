import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  // Explicitly await the icon fonts so glyphs don't render as blank boxes
  // on web / first-launch. Native builds cache these after first run.
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.brand }} />;
  }

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
        <Stack.Screen name="account" />
        <Stack.Screen name="match/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
