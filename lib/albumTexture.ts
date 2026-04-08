import * as THREE from 'three';

export type AlbumData = {
  bg: string;
  accent: string;
  title: string;
  artist: string;
  /** 수집 LP 라벨 색 — 턴테이블·슬리브 디스크 중앙 등 (없으면 accent 사용) */
  labelColor?: string;
  /**
   * HTTPS 앨범 커버 (Deezer CDN / iTunes mzstatic 등 CORS 허용 호스트).
   * 실패 시 createAlbumTexture() 절차적 커버로 대체.
   */
  coverUrl?: string;
  /** @deprecated coverUrl 사용 */
  wikiUrl?: string;
};

// Deezer cover_xl / iTunes artwork — 위키 업로드 URL은 404·차단이 잦아 CDN 고정 URL 사용
export const DEMO_ALBUMS: AlbumData[] = [
  {
    bg: '#00509D',
    accent: '#90E0EF',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/fb9fbd93db667e24d4f5dee781e83f7d/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#1A1A2E',
    accent: '#E94560',
    title: 'After Hours',
    artist: 'The Weeknd',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/fd00ebd6d30d7253f813dba3bb1c66a9/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#FF6B35',
    accent: '#FFBE0B',
    title: 'Discovery',
    artist: 'Daft Punk',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/5718f7c81c27e0b2417e2a4c45224f8a/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#5A0080',
    accent: '#FFD700',
    title: 'Purple Rain',
    artist: 'Prince',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/487e355f3c401167480ea413894aab8d/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#003566',
    accent: '#48CAE4',
    title: 'Blonde',
    artist: 'Frank Ocean',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/f798a866107715dd6dc1049e498ce21f/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#1B4332',
    accent: '#95D5B2',
    title: 'Abbey Road',
    artist: 'The Beatles',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/aa94ab293730bb7845d2aa8c672b2c29/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#9B2226',
    accent: '#F1FAEE',
    title: 'Back to Black',
    artist: 'Amy Winehouse',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/5772b495f0dcdf660d0fc88c4c38a3fa/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#F77F00',
    accent: '#FCBF49',
    title: 'Thriller',
    artist: 'Michael Jackson',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/92a024220a9532489c75c9d994835697/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#3D405B',
    accent: '#E07A5F',
    title: 'Currents',
    artist: 'Tame Impala',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/de5b9b704cd4ec36f8bf49beb3e17ba2/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#6B2D8B',
    accent: '#E040FB',
    title: 'Random Access',
    artist: 'Daft Punk',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/311bba0fc112d15f72c8b5a65f0456c1/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#0D3B66',
    accent: '#FAF0CA',
    title: 'Dark Side',
    artist: 'Pink Floyd',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/e635a8510c1a74bc089b3566ebbb9cb8/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#0A2463',
    accent: '#FB3640',
    title: 'OK Computer',
    artist: 'Radiohead',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/05a186e0a859a36f9cd51cdae2158fe1/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#B5179E',
    accent: '#FF85A1',
    title: 'Horses',
    artist: 'Patti Smith',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/a8ca011b0b2b9a757c3911a1f7798f18/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#FF4500',
    accent: '#FF8C00',
    title: 'Nevermind',
    artist: 'Nirvana',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/f0282817b697279e56df13909962a54a/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#004E89',
    accent: '#00A8E8',
    title: 'Remain in Light',
    artist: 'Talking Heads',
    coverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music/87/5f/5b/mzi.zzquknhm.jpg/600x600bb.jpg',
  },
  {
    bg: '#1D3557',
    accent: '#A8DADC',
    title: 'Blue Train',
    artist: 'John Coltrane',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/df662c162fd269bedea7c28d05321ff8/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#560BAD',
    accent: '#B5179E',
    title: 'The Rise and Fall',
    artist: 'David Bowie',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/d252dc1d19e993831e13eb3c84f09193/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#06402B',
    accent: '#00FF87',
    title: 'A Love Supreme',
    artist: 'Coltrane',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/41ae651a2f190e6f8dff4669367e710e/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#7B2D00',
    accent: '#FF9A3C',
    title: 'Bitches Brew',
    artist: 'Miles Davis',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/bbc96da10e597caa2cb32e98f9af037a/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#2C003E',
    accent: '#FF4DFF',
    title: 'Parallel Lines',
    artist: 'Blondie',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/9a11554bc8913e62f3484e3a8ac1d0ee/1000x1000-000000-80-0-0.jpg',
  },
  {
    bg: '#C41230',
    accent: '#FFD700',
    title: 'London Calling',
    artist: 'The Clash',
    coverUrl:
      'https://cdn-images.dzcdn.net/images/cover/1dbb7d7bee08ed2b18deabffd675bd36/1000x1000-000000-80-0-0.jpg',
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function resolveCoverUrl(album: AlbumData): string | undefined {
  return album.coverUrl ?? album.wikiUrl;
}

/** Deezer CDN만 해상도 축소 — 다른 호스트 URL 패턴은 건드리지 않음 */
function optimizeCoverUrl(url: string): string {
  if (url.includes('cdn-images.dzcdn.net')) {
    return url.replace(/\/\d+x\d+-/, '/264x264-');
  }
  return url;
}

/** 위키 업로드 URL은 404·핫링크 차단이 잦고, 예전 컬렉션 JSON에 남아 있을 수 있음 */
export function isUnreliableCoverArtUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes('wikimedia.org') ||
      host.includes('wikipedia.org') ||
      host.endsWith('.wikipedia.org')
    );
  } catch {
    return true;
  }
}

export function getSanitizedArtworkUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return isUnreliableCoverArtUrl(url) ? null : url;
}

/**
 * 로드된 커버 아트에 미세 그레인만 얹어 LP 슬리브 질감 — 색은 거의 그대로 유지
 */
function applyMattePaperGrain(source: THREE.Texture): THREE.Texture {
  if (typeof document === 'undefined') return source;
  const img = source.image as HTMLImageElement | undefined;
  if (!img || !('width' in img) || img.width < 2) return source;

  const maxSide = 640;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return source;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let p = 0; p < d.length; p += 4) {
    const px = (p / 4) % w;
    const py = Math.floor(p / 4 / w);
    const g =
      Math.sin(px * 0.82 + py * 1.37) * 2.0 +
      Math.sin(px * 0.21 + py * 0.33) * 1.6 +
      Math.sin((px + py) * 0.11) * 1.2;
    d[p] = Math.max(0, Math.min(255, d[p] + g));
    d[p + 1] = Math.max(0, Math.min(255, d[p + 1] + g));
    d[p + 2] = Math.max(0, Math.min(255, d[p + 2] + g));
  }
  ctx.putImageData(imageData, 0, 0);

  const out = new THREE.CanvasTexture(canvas);
  out.colorSpace = THREE.SRGBColorSpace;
  out.generateMipmaps = false;
  out.minFilter = THREE.LinearFilter;
  out.magFilter = THREE.LinearFilter;
  out.needsUpdate = true;
  source.dispose();
  return out;
}

export function createAlbumTexture(album: AlbumData): THREE.Texture {
  if (typeof document === 'undefined') {
    const [r, g, b] = hexToRgb(album.bg);
    const data = new Uint8Array([r, g, b, 255]);
    const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    t.needsUpdate = true;
    return t;
  }

  const SIZE = 256; // Fix 5: 선반용으로 256이면 충분 (VRAM 절약)
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, album.bg);
  const [r, g, b] = hexToRgb(album.bg);
  grad.addColorStop(1, `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 30, 255)}, ${Math.min(b + 50, 255)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const alpha = Math.random() * 0.06;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.strokeStyle = album.accent;
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 12; i++) {
    ctx.lineWidth = 0.8 + Math.random() * 1.2;
    ctx.beginPath();
    const x1 = Math.random() * SIZE;
    const x2 = Math.random() * SIZE;
    const y = (i / 11) * SIZE;
    ctx.moveTo(x1, y + (Math.random() - 0.5) * 20);
    ctx.bezierCurveTo(
      SIZE * 0.25,
      y + (Math.random() - 0.5) * 30,
      SIZE * 0.75,
      y + (Math.random() - 0.5) * 30,
      x2,
      y + (Math.random() - 0.5) * 20
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = album.accent;
  ctx.lineWidth = 2;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE * 0.45, i * 44, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = album.accent;
  ctx.font = `bold ${SIZE * 0.075}px "Arial Black", Arial`;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(album.artist.toUpperCase(), SIZE / 2, SIZE * 0.12);

  ctx.font = `italic ${SIZE * 0.055}px Georgia, serif`;
  ctx.globalAlpha = 0.9;
  ctx.fillText(album.title, SIZE / 2, SIZE * 0.88);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = album.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(SIZE * 0.1, SIZE * 0.155);
  ctx.lineTo(SIZE * 0.9, SIZE * 0.155);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function loadAlbumTexture(album: AlbumData, onLoad: (t: THREE.Texture) => void): void {
  const url = resolveCoverUrl(album);
  if (url && isUnreliableCoverArtUrl(url)) {
    onLoad(createAlbumTexture(album));
    return;
  }
  if (url && typeof document !== 'undefined') {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const optimizedUrl = optimizeCoverUrl(url);
    loader.load(
      optimizedUrl,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.generateMipmaps = false;
        t.minFilter = THREE.LinearFilter;
        t.needsUpdate = true;
        onLoad(applyMattePaperGrain(t));
      },
      undefined,
      () => onLoad(createAlbumTexture(album))
    );
  } else {
    onLoad(createAlbumTexture(album));
  }
}
