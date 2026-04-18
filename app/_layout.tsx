import { Stack } from "expo-router";
import { useEffect } from "react";
import { registerBackgroundSync } from "@/services/task-service";

export default function RootLayout() {
  useEffect(() => {
    registerBackgroundSync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
