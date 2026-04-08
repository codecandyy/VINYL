import React, { useState } from 'react';
import { Platform } from 'react-native';

type Props = {
  onClick: () => void;
};

export function LPShopIcon({ onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  if (Platform.OS !== 'web') return null;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: '60px',
        right: '16px',
        width: '64px',
        height: '64px',
        background: hovered
          ? 'rgba(40, 26, 10, 0.92)'
          : 'rgba(26, 16, 6, 0.82)',
        border: `1px solid ${hovered ? '#E8903C' : 'rgba(200,120,60,0.55)'}`,
        borderRadius: '10px',
        cursor: 'pointer',
        padding: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.15s ease, background 0.15s ease, border-color 0.15s ease',
        filter: hovered
          ? 'drop-shadow(0 0 10px rgba(200,120,60,0.7))'
          : 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
        boxSizing: 'border-box',
      } as React.CSSProperties}
    >
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        width="52"
        height="52"
      >
        {/* 지붕 */}
        <polygon
          points="4,28 32,10 60,28"
          fill="#3A2A12"
          stroke={hovered ? '#E8903C' : '#C8783C'}
          strokeWidth="1.5"
        />

        {/* 굴뚝 */}
        <rect x="44" y="12" width="5" height="10" fill="#2A1C0A" />
        {/* 굴뚝 연기 점들 */}
        <circle cx="46" cy="10" r="1.5" fill="rgba(200,160,80,0.4)" />
        <circle cx="48" cy="7" r="1" fill="rgba(200,160,80,0.25)" />

        {/* 건물 몸체 */}
        <rect x="8" y="28" width="48" height="28" fill="#2A1C0A" rx="2" />

        {/* 건물 외벽 질감 — 세로 줄 */}
        <line x1="18" y1="28" x2="18" y2="56" stroke="#221608" strokeWidth="0.5" />
        <line x1="32" y1="28" x2="32" y2="56" stroke="#221608" strokeWidth="0.5" />
        <line x1="46" y1="28" x2="46" y2="56" stroke="#221608" strokeWidth="0.5" />

        {/* 간판 배경 */}
        <rect x="12" y="22" width="40" height="10"
          fill={hovered ? '#D88A3C' : '#C8783C'} rx="1" />
        {/* 간판 하이라이트 */}
        <rect x="12" y="22" width="40" height="2"
          fill="rgba(255,220,150,0.25)" rx="1" />

        {/* 간판 텍스트 */}
        <text
          x="32"
          y="30"
          fontFamily="monospace"
          fontSize="6"
          fill="#F5EDD8"
          textAnchor="middle"
          letterSpacing="0.5"
          fontWeight="bold"
        >
          LP SHOP
        </text>

        {/* 좌측 창문 */}
        <rect x="11" y="34" width="11" height="9" fill="#3A2A12" rx="1" />
        <rect x="12" y="35" width="9" height="7" fill={hovered ? '#6A5030' : '#4A3820'} rx="1" />
        <line x1="12" y1="38.5" x2="21" y2="38.5" stroke="#2A1E0A" strokeWidth="0.8" />
        <line x1="16.5" y1="35" x2="16.5" y2="42" stroke="#2A1E0A" strokeWidth="0.8" />
        {/* 창문 빛 반사 */}
        <rect x="13" y="36" width="3" height="2" fill="rgba(255,220,150,0.15)" rx="0.5" />

        {/* 우측 창문 */}
        <rect x="42" y="34" width="11" height="9" fill="#3A2A12" rx="1" />
        <rect x="43" y="35" width="9" height="7" fill={hovered ? '#6A5030' : '#4A3820'} rx="1" />
        <line x1="43" y1="38.5" x2="52" y2="38.5" stroke="#2A1E0A" strokeWidth="0.8" />
        <line x1="47.5" y1="35" x2="47.5" y2="42" stroke="#2A1E0A" strokeWidth="0.8" />
        <rect x="44" y="36" width="3" height="2" fill="rgba(255,220,150,0.15)" rx="0.5" />

        {/* 문 */}
        <rect x="26" y="41" width="12" height="15" fill="#1A1008" rx="1" />
        <rect x="27" y="42" width="10" height="13" fill="#3D2A10" rx="1" />
        {/* 문 아치 */}
        <path d="M27,48 Q32,44 37,48" stroke="#C8783C" strokeWidth="0.8" fill="none" />

        {/* 문 손잡이 */}
        <circle cx="35" cy="49" r="1.2" fill={hovered ? '#E8903C' : '#C8783C'} />

        {/* 계단 */}
        <rect x="24" y="54" width="16" height="2.5" fill="#3A2A12" />
        <rect x="22" y="56.5" width="20" height="2.5" fill="#2A1C0A" />

        {/* 건물 모서리 */}
        <rect x="7" y="28" width="2" height="28" fill="#3A2A12" rx="1" />
        <rect x="55" y="28" width="2" height="28" fill="#3A2A12" rx="1" />

        {/* 문 앞 조명 */}
        {hovered && (
          <ellipse cx="32" cy="57" rx="6" ry="2"
            fill="rgba(200,160,60,0.2)" />
        )}
      </svg>

      {/* 툴팁 */}
      {hovered && (
        <span
          style={{
            position: 'absolute',
            top: '68px',
            right: '0',
            background: 'rgba(20, 12, 4, 0.95)',
            border: '1px solid #C8783C',
            color: '#F5EDD8',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            letterSpacing: '0.08em',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
          } as React.CSSProperties}
        >
          LP 추가하기
        </span>
      )}
    </button>
  );
}
