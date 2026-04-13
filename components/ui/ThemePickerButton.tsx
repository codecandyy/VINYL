import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRoomStore } from '../../stores/roomStore';
import { THEME_LIST } from '../../lib/themes';
import type { ThemeId } from '../../lib/themes';

/**
 * ThemePickerButton — 우측 하단 고정, 웹 전용
 * 버튼 클릭 → 3개 테마 옵션 팝업
 */
export function ThemePickerButton() {
  const [open, setOpen] = useState(false);
  const roomTheme = useRoomStore((s) => s.roomTheme);
  const setRoomTheme = useRoomStore((s) => s.setRoomTheme);
  const containerRef = useRef<HTMLDivElement>(null);

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (Platform.OS !== 'web') return null;

  const currentTheme = THEME_LIST.find((t) => t.id === roomTheme) ?? THEME_LIST[0];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 90,
        right: 16,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* 팝업 패널 */}
      {open && (
        <div
          style={{
            background: 'rgba(12, 8, 4, 0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '10px 0',
            minWidth: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              letterSpacing: '0.18em',
              color: 'rgba(255,255,255,0.35)',
              padding: '0 14px 8px',
              textTransform: 'uppercase',
            }}
          >
            Select Theme
          </div>
          {THEME_LIST.map((theme, idx) => {
            const isActive = theme.id === roomTheme;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setRoomTheme(theme.id as ThemeId);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 14px',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive
                    ? `2px solid ${theme.swatch}`
                    : '2px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                {/* 스워치 */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: theme.swatch,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 2px rgba(255,255,255,0.3)` : 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* 번호 + 이름 */}
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                      fontWeight: isActive ? 700 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {idx}. {theme.label}
                  </div>
                </div>
                {/* 체크마크 */}
                {isActive && (
                  <span style={{ color: theme.swatch, fontSize: 13, flexShrink: 0 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px 6px 8px',
          background: open
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(12, 8, 4, 0.82)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 20,
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {/* 현재 테마 스워치 */}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: currentTheme.swatch,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            letterSpacing: '0.16em',
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          THEME
        </span>
      </button>
    </div>
  );
}
