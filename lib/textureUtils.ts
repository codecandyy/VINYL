import * as THREE from 'three';

// 절차적 우드 그레인 텍스처
export function createWoodTexture(
  darkColor = '#1C0A02',
  lightColor = '#2C1408',
  grainColor = '#3D1C06'
): THREE.Texture {
  if (typeof document === 'undefined') {
    const [r, g, b] = [28, 10, 2];
    const data = new Uint8Array([r, g, b, 255]);
    const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    t.needsUpdate = true;
    return t;
  }

  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 베이스 그라디언트
  const base = ctx.createLinearGradient(0, 0, W, 0);
  base.addColorStop(0, darkColor);
  base.addColorStop(0.3, lightColor);
  base.addColorStop(0.7, darkColor);
  base.addColorStop(1, lightColor);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // 나무결 선
  for (let i = 0; i < 80; i++) {
    const y = (Math.random() * H * 1.5) - H * 0.25;
    const alpha = 0.05 + Math.random() * 0.18;
    const width = 0.5 + Math.random() * 2.5;

    ctx.strokeStyle = Math.random() > 0.5 ? grainColor : 'rgba(80,35,5,0.3)';
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, y);

    let cx = 0;
    while (cx < W) {
      const step = 30 + Math.random() * 50;
      ctx.lineTo(cx + step, y + (Math.random() - 0.5) * 8);
      cx += step;
    }
    ctx.stroke();
  }

  // 미세 노이즈
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 레드 카펫 텍스처
export function createCarpetTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    const data = new Uint8Array([80, 10, 10, 255]);
    const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    t.needsUpdate = true;
    return t;
  }

  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#5A0A0A';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 카펫 파일(섬유) 노이즈
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const brightness = 0.6 + Math.random() * 0.4;
    ctx.fillStyle = `rgba(${Math.floor(100 * brightness)},${Math.floor(10 * brightness)},${Math.floor(10 * brightness)},0.4)`;
    ctx.fillRect(x, y, 1, Math.random() < 0.3 ? 2 : 1);
  }

  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Toon 셰이딩 그라디언트 맵 (3-band)
export function createToonGradient(): THREE.DataTexture {
  // 4픽셀: shadow, mid-shadow, mid-light, highlight
  const data = new Uint8Array([
    30, 15,  5, 255,  // deep shadow
    90, 45, 15, 255,  // shadow
   160, 85, 30, 255,  // midtone
   220,130, 55, 255,  // highlight
  ]);
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

// 메탈(구리/브론즈) 텍스처
export function createMetalTexture(color = '#B87333'): THREE.DataTexture {
  const [r, g, b] = [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
  const data = new Uint8Array([r, g, b, 255]);
  const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}
