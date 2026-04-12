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

  // 웹에서 html/body/root 가 100vh를 채우도록 강제 — height:100% 상속 체인 보장
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
      html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
      #root { height: 100%; display: flex; flex-direction: column; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <View
      style={
        Platform.OS === 'web'
          ? ({ flex: 1, height: '100vh', overflow: 'hidden' } as object)
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
