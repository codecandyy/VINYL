/**
 * GrooveSeekView — web-only HTML Canvas LP groove overlay.
 * Shows track segments (or time markers) spiraling along LP grooves.
 * Click / tap to seek to that position.
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { audioEngine } from '../../lib/audioEngine';
import { MusicTrack } from '../../lib/music';
import { colors } from '../../lib/constants';

interface Props {
  tracks: MusicTrack[];
  positionMs: number;
  durationMs: number;
  onClose: () => void;
}

const TRACK_COLORS = [
  '#c8913a', '#7fb3a0', '#a07bbf', '#6a9ec9', '#c97070',
  '#8aab6a', '#bf8f5a', '#7aaec0', '#b87a9a', '#8aaa5a',
];

export function GrooveSeekView({ tracks, positionMs, durationMs, onClose }: Props) {
  if (Platform.OS !== 'web') return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(positionMs);
  const durRef = useRef(durationMs);
  const tracksRef = useRef(tracks);
  posRef.current = positionMs;
  durRef.current = durationMs;
  tracksRef.current = tracks;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.min(W, H) * 0.46;
    const minR = maxR * 0.24; // spindle hole area
    const grooveR = maxR * 0.94; // outermost groove
    const labelR = maxR * 0.28;  // label disc radius

    ctx.clearRect(0, 0, W, H);

    // ── background ─────────────────────────────────────────────────
    ctx.fillStyle = '#0e0b08';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR + 4, 0, Math.PI * 2);
    ctx.fill();

    // ── groove rings ──────────────────────────────────────────────
    const ringCount = 28;
    for (let i = 0; i < ringCount; i++) {
      const r = labelR + ((grooveR - labelR) * i) / (ringCount - 1);
      const alpha = 0.04 + 0.08 * (i % 2);
      ctx.strokeStyle = `rgba(180,160,120,${alpha})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── label disc ────────────────────────────────────────────────
    const grad = ctx.createRadialGradient(cx - labelR * 0.18, cy - labelR * 0.18, labelR * 0.1, cx, cy, labelR);
    grad.addColorStop(0, '#3d2f1e');
    grad.addColorStop(1, '#1e160c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, labelR, 0, Math.PI * 2);
    ctx.fill();

    // ── track segments (multi-track) or time markers ───────────────
    const currentTracks = tracksRef.current;
    const currentPos = posRef.current;
    const totalDur = durRef.current > 0 ? durRef.current : 1;

    if (currentTracks.length > 1) {
      // Calculate cumulative durations
      const durations = currentTracks.map((t) => (t.durationMs ?? 30000));
      const totalMs = durations.reduce((a, b) => a + b, 0) || 1;
      let cumulative = 0;

      currentTracks.forEach((track, idx) => {
        const dur = durations[idx];
        const startRatio = cumulative / totalMs;
        const endRatio = (cumulative + dur) / totalMs;
        cumulative += dur;

        // LP plays outer to inner, angle goes from -PI/2 clockwise
        // ratio 0 = outermost, ratio 1 = innermost
        const startAngle = -Math.PI / 2 + startRatio * Math.PI * 2;
        const endAngle = -Math.PI / 2 + endRatio * Math.PI * 2;

        // Draw arc band between grooveR and labelR at this angle sector
        const arcOutR = grooveR - (grooveR - labelR) * startRatio;
        const arcInR = grooveR - (grooveR - labelR) * endRatio;
        const midR = (arcOutR + arcInR) / 2;

        const color = TRACK_COLORS[idx % TRACK_COLORS.length];

        // Arc segment highlight
        ctx.strokeStyle = color + '88';
        ctx.lineWidth = (arcOutR - arcInR) * 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, midR, startAngle, endAngle);
        ctx.stroke();

        // Track name curved text at midpoint angle
        const midAngle = (startAngle + endAngle) / 2;
        const textR = midR;
        ctx.save();
        ctx.translate(cx + Math.cos(midAngle) * textR, cy + Math.sin(midAngle) * textR);
        ctx.rotate(midAngle + Math.PI / 2);
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.max(9, Math.floor(maxR * 0.058))}px 'Special Elite', 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = track.title.length > 18 ? track.title.slice(0, 16) + '…' : track.title;
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });
    } else {
      // Single track — time markers every ~10s
      const intervalMs = totalDur > 120000 ? 30000 : totalDur > 60000 ? 15000 : 10000;
      const markerCount = Math.floor(totalDur / intervalMs);
      for (let i = 0; i <= markerCount; i++) {
        const ratio = (i * intervalMs) / totalDur;
        const angle = -Math.PI / 2 + ratio * Math.PI * 2;
        const r = grooveR - (grooveR - labelR) * ratio;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        ctx.fillStyle = '#c8913a99';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        const secs = Math.round((i * intervalMs) / 1000);
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        const label = `${mins}:${String(s).padStart(2, '0')}`;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#d4b896cc';
        ctx.font = `${Math.max(8, Math.floor(maxR * 0.052))}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, 0, -5);
        ctx.restore();
      }
    }

    // ── playhead needle line ───────────────────────────────────────
    const ratio = totalDur > 0 ? currentPos / totalDur : 0;
    const needleAngle = -Math.PI / 2 + ratio * Math.PI * 2;
    const needleOutR = grooveR;
    const needleInR = labelR + 4;

    ctx.strokeStyle = '#FFB84D';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FFB84D';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(needleAngle) * needleInR, cy + Math.sin(needleAngle) * needleInR);
    ctx.lineTo(cx + Math.cos(needleAngle) * needleOutR, cy + Math.sin(needleAngle) * needleOutR);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── center spindle ─────────────────────────────────────────────
    ctx.fillStyle = '#0e0b08';
    ctx.beginPath();
    ctx.arc(cx, cy, minR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2e22';
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── spindle hole ───────────────────────────────────────────────
    ctx.fillStyle = '#050302';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Animate
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = Math.round(width * devicePixelRatio);
        canvas.height = Math.round(height * devicePixelRatio);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
      }
    });
    ro.observe(parent);
    const { width, height } = parent.getBoundingClientRect();
    if (width > 0) {
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    return () => ro.disconnect();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxR = Math.min(rect.width, rect.height) * 0.46;
    const minR = maxR * 0.24;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

    // Only respond to clicks within groove area
    if (dist < minR || dist > maxR) return;

    const angle = Math.atan2(y - cy, x - cx);
    // Normalize: angle starts at -PI/2 (top), goes clockwise
    let ratio = (angle + Math.PI / 2) / (Math.PI * 2);
    if (ratio < 0) ratio += 1;

    const seekSecs = (ratio * durRef.current) / 1000;
    audioEngine.seekTo(seekSecs);
    onClose();
  }, [onClose]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Canvas overlay in the LP area */}
      <View style={styles.canvasWrap} pointerEvents="box-none">
        {/* @ts-ignore — web-only canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }}
          onClick={handleClick}
        />
        {/* Close hint */}
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>TAP GROOVE TO SEEK · ESC TO CLOSE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  canvasWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80, // leave room for controls below
    pointerEvents: 'box-none' as any,
  },
  hint: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(200,170,110,0.7)',
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: (Platform.OS === 'web' ? "'Courier New', monospace" : undefined) as any,
  },
});
