import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/constants';

// 로그인 없이 항상 접근 가능 — 인증 체크 제거
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.copper,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="room"
        options={{
          title: 'ROOM',
          tabBarStyle: {
            display: 'none',
            height: 0,
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
          },
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconFocused]}>🎵</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'COLLECTION',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconFocused]}>💿</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'SHOP',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconFocused]}>🪙</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.icon, focused && styles.iconFocused]}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg2,
    borderTopWidth: 1,
    borderTopColor: colors.shelf,
    height: 60,
    paddingBottom: 8,
  },
  icon: { fontSize: 20, opacity: 0.45 },
  iconFocused: { opacity: 1 },
  tabLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
});
