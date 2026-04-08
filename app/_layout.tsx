import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
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
    <View
      style={
        Platform.OS === 'web'
          ? ({ flex: 1, minHeight: '100vh', height: '100%' } as object)
          : { flex: 1 }
      }
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="room" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
