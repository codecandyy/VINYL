import { Redirect } from 'expo-router';

// 로그인 없이 바로 Room으로 이동
export default function LoginScreen() {
  return <Redirect href="/room" />;
}
