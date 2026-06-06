import { BezierPoint, ColorStop } from '../types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function evaluateCubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const invT = 1 - t;
  return (
    invT * invT * invT * p0 +
    3 * invT * invT * t * p1 +
    3 * invT * t * t * p2 +
    t * t * t * p3
  );
}

export function evaluateBezier(
  curve: [number, number, number, number] | BezierPoint[],
  t: number
): number {
  if (Array.isArray(curve) && curve.length === 4 && typeof curve[0] === 'number') {
    const [y0, cp1y, cp2y, y1] = curve as [number, number, number, number];
    return evaluateCubicBezier(t, y0, cp1y, cp2y, y1);
  }

  const points = curve as BezierPoint[];
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0].y;

  const sorted = [...points].sort((a, b) => a.x - b.x);
  t = Math.max(0, Math.min(1, t));

  if (t <= sorted[0].x) return sorted[0].y;
  if (t >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.x && t <= b.x) {
      const range = b.x - a.x;
      const localT = range === 0 ? 0 : (t - a.x) / range;
      return evaluateCubicBezier(localT, a.y, a.cp2y, b.cp1y, b.y);
    }
  }

  return sorted[sorted.length - 1].y;
}

function parseColor(color: string): [number, number, number, number] {
  color = color.trim();

  if (color.startsWith('rgba(')) {
    const match = color.match(/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      return [
        parseFloat(match[1]) / 255,
        parseFloat(match[2]) / 255,
        parseFloat(match[3]) / 255,
        parseFloat(match[4]),
      ];
    }
  }

  if (color.startsWith('rgb(')) {
    const match = color.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (match) {
      return [
        parseFloat(match[1]) / 255,
        parseFloat(match[2]) / 255,
        parseFloat(match[3]) / 255,
        1,
      ];
    }
  }

  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length === 8) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      parseInt(hex.slice(6, 8), 16) / 255,
    ];
  }
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      1,
    ];
  }

  return [1, 1, 1, 1];
}

export function sampleColorGradient(stops: ColorStop[], t: number): [number, number, number, number] {
  if (stops.length === 0) {
    return [1, 1, 1, 1];
  }
  if (stops.length === 1) {
    return parseColor(stops[0].color);
  }

  const sorted = [...stops].sort((a, b) => a.t - b.t);
  t = Math.max(0, Math.min(1, t));

  if (t <= sorted[0].t) {
    return parseColor(sorted[0].color);
  }
  if (t >= sorted[sorted.length - 1].t) {
    return parseColor(sorted[sorted.length - 1].color);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const range = b.t - a.t;
      const localT = range === 0 ? 0 : (t - a.t) / range;
      const ca = parseColor(a.color);
      const cb = parseColor(b.color);
      return [
        ca[0] + (cb[0] - ca[0]) * localT,
        ca[1] + (cb[1] - ca[1]) * localT,
        ca[2] + (cb[2] - ca[2]) * localT,
        ca[3] + (cb[3] - ca[3]) * localT,
      ];
    }
  }

  return parseColor(sorted[sorted.length - 1].color);
}
