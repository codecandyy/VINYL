import { LocalLP } from './localCollection';
import { CUBBY_COLS, SHELF_SLOT_COUNT } from '../components/scene/ShelfUnit';

/** 진열장 한 페이지당 슬롯 수 (8×3 전부 표시) */
export const SHELF_PAGE_CAPACITY = 24;

/**
 * 슬롯 인덱스: buildShelfAlbumSlots 기준 row0=하단(0–7), row1=중간(8–15), row2=상단(16–23).
 * 채움 순서(orderedLps[0]=최신): 상단 좌→우 → 중간 좌→우 → 하단 좌→우.
 */
export const SHELF_VISIBLE_SLOT_INDICES: number[] = [
  ...Array.from({ length: CUBBY_COLS }, (_, col) => 16 + col),
  ...Array.from({ length: CUBBY_COLS }, (_, col) => 8 + col),
  ...Array.from({ length: CUBBY_COLS }, (_, col) => col),
];

export function orderLpsForShelf(lps: LocalLP[]): LocalLP[] {
  return [...lps].sort((a, b) => {
    const t = b.createdAt.localeCompare(a.createdAt);
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}

export function shelfMaxPage(orderedLps: LocalLP[]): number {
  if (orderedLps.length === 0) return 0;
  return Math.ceil(orderedLps.length / SHELF_PAGE_CAPACITY) - 1;
}

/** 길이 SHELF_SLOT_COUNT: 슬롯 i 에 놓일 LP (없으면 undefined → 데모 커버) */
export function shelfSlotLpArrayForPage(orderedLps: LocalLP[], page: number): (LocalLP | undefined)[] {
  const start = page * SHELF_PAGE_CAPACITY;
  const chunk = orderedLps.slice(start, start + SHELF_PAGE_CAPACITY);
  const out: (LocalLP | undefined)[] = Array.from({ length: SHELF_SLOT_COUNT }, () => undefined);
  for (let k = 0; k < chunk.length; k++) {
    const slot = SHELF_VISIBLE_SLOT_INDICES[k];
    out[slot] = chunk[k];
  }
  return out;
}
