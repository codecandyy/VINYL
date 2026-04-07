import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEMO_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDE3OTk2MDAsImV4cCI6MTk1NzM3NjAwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

// Missing/invalid .env would make createClient throw and break the whole bundle (e.g. web preview).
const supabaseUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://preview-placeholder.supabase.co';
const supabaseAnonKey = rawKey.length > 0 ? rawKey : DEMO_ANON_KEY;

function webLocalStorage(): Storage | null {
  try {
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

// SecureStore adapter for native, localStorage for web (guard SSR: no localStorage in Node)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      const ls = webLocalStorage();
      return Promise.resolve(ls ? ls.getItem(key) : null);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      const ls = webLocalStorage();
      if (ls) ls.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      const ls = webLocalStorage();
      if (ls) ls.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type LPRecord = {
  id: string;
  user_id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string | null;
  label_color: string;
  label_text_color: string;
  custom_text: string | null;
  is_damaged: boolean;
  last_played_at: string | null;
  created_at: string;
};

export type RoomState = {
  user_id: string;
  dust_level: number;
  last_cleaned_at: string;
  last_visited_at: string;
  player_skin: string;
  room_theme: string;
  coin_balance: number;
};
