// 모던 레트로 재즈바 팔레트 — 크림 화이트 벽 + 에보니 우드 + 레드 포인트
export const colors = {
  // UI 배경 — 앱 배경은 다크하게 유지 (3D 씬과 분리)
  bg:     '#0E0A06',   // 딥 다크 (UI 모달 뒤)
  bg2:    '#181210',   // 약간 밝은 다크
  bg3:    '#221A12',   // 카드 배경

  // 포인트 컬러
  copper: '#CC2020',   // 레드 포인트 (버튼 primary) — 구리 → 레드로 교체
  gold:   '#B8962E',   // 브라스 골드 (악센트)
  cream:  '#F5EDD8',   // 크림 화이트 (텍스트, 소품)
  muted:  '#8A7A6A',   // 뮤트 텍스트
  red:    '#8B0000',   // 딥 크림슨 (경고/카펫)
  shelf:  '#2A1E0E',   // 에보니 우드 (보더/구분선)

  // 추가 팔레트
  offWhite: '#EDE5D0', // 오프화이트
  ebony:    '#1A1208', // 에보니 다크 우드
  chrome:   '#C0C0C8', // 크롬 실버
  brass:    '#B8962E', // 브라스
};

export const ROOM = { w: 8, h: 4, d: 6 };
export const ALBUM_WALL_ROWS = 3;
export const ALBUM_WALL_COLS = 8;
export const MAX_ALBUMS = ALBUM_WALL_ROWS * ALBUM_WALL_COLS; // 24 (3D 책장 큐비와 동일)
