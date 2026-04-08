import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useCollection } from '../hooks/useCollection';

SplashScreen.preventAutoHideAsync();
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'room',
};

export default function RootLayout() {
  // 앱 시작 시 로컬 컬렉션 로드
  const { loadCollection } = useCollection();

  useEffect(() => {
    loadCollection().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="room" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
