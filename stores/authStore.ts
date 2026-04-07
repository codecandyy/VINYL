import { create } from 'zustand';

/**
 * 인증 상태
 * - isGuest=true: 로그인 없이 사용 (컬렉션은 로컬 저장)
 * - userId가 있으면 Supabase 로그인 상태 (컬렉션 클라우드 동기화)
 */
type AuthStore = {
  userId: string | null;       // Supabase 유저 ID
  userEmail: string | null;
  isGuest: boolean;            // 항상 true (로그인 = false)
  isAuthenticated: boolean;    // Supabase 로그인 여부
  setUser: (id: string | null, email?: string | null) => void;
  setGuest: (v: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  userEmail: null,
  isGuest: true,
  isAuthenticated: false,

  setUser: (id, email = null) =>
    set({
      userId: id,
      userEmail: email,
      isAuthenticated: id !== null,
      isGuest: id === null,
    }),

  setGuest: (v) => set({ isGuest: v }),

  logout: () =>
    set({
      userId: null,
      userEmail: null,
      isAuthenticated: false,
      isGuest: true,
    }),
}));
