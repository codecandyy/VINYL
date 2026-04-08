/**
 * Web Vibration API 래퍼
 * iOS Safari 미지원 → try-catch로 조용히 무시
 * Android Chrome 지원
 */
const vibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // 미지원 기기 무시
  }
};

export const haptics = {
  /** LP 들어올릴 때 — 가볍게 */
  lift: () => vibrate(15),

  /** 턴테이블 영역 진입 — 중간 */
  hover: () => vibrate(25),

  /** 플래터 착지 — 묵직하고 찰진 느낌 */
  drop: () => vibrate([60, 20, 40, 20, 20]),

  /** 스핀들에 딸깍 끼워짐 */
  platterSnap: () => vibrate([32, 14, 38, 10, 22]),

  /** 플래터 스냅 존 진입 — 짧은 탈칵 */
  dockTick: () => vibrate([22, 12, 28]),

  /** 잘못된 위치 드롭 — 실패 느낌 */
  reject: () => vibrate([10, 50, 10]),

  /** 바늘 착지 */
  needle: () => vibrate(8),

  /** 스크러빙 중 틱틱 */
  scrubTick: () => vibrate(6),
};
