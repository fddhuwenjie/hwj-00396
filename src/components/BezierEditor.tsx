import React, { useEffect, useRef, useCallback } from 'react';
import { BezierPoint } from '../types';
import { cn } from '../lib/utils';

interface BezierEditorProps {
  value: BezierPoint[] | [number, number, number, number];
  onChange: (points: BezierPoint[]) => void;
  height?: number;
  className?: string;
}

type DragTarget =
  | { type: 'anchor'; index: number }
  | { type: 'cp1'; index: number }
  | { type: 'cp2'; index: number }
  | null;

const ANCHOR_RADIUS = 6;
const CP_SIZE = 8;
const PADDING = 24;

function normalizeValue(
  value: BezierPoint[] | [number, number, number, number]
): BezierPoint[] {
  if (
    Array.isArray(value) &&
    value.length === 4 &&
    typeof value[0] === 'number'
  ) {
    const [y0, cp1y, cp2y, y1] = value as [number, number, number, number];
    return [
      { x: 0, y: y0, cp1x: 0.33, cp1y: cp1y, cp2x: 0.33, cp2y: y0 },
      { x: 1, y: y1, cp1x: 0.66, cp1y: y1, cp2x: 0.66, cp2y: cp2y },
    ];
  }
  return [...(value as BezierPoint[])].sort((a, b) => a.x - b.x);
}

export default function BezierEditor({
  value,
  onChange,
  height = 160,
  className,
}: BezierEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragTarget>(null);
  const pointsRef = useRef<BezierPoint[]>(normalizeValue(value));

  useEffect(() => {
    pointsRef.current = normalizeValue(value);
    draw();
  }, [value]);

  const toCanvas = useCallback(
    (x: number, y: number, w: number, h: number) => {
      const innerW = w - PADDING * 2;
      const innerH = h - PADDING * 2;
      return {
        px: PADDING + x * innerW,
        py: PADDING + (1 - y) * innerH,
      };
    },
    []
  );

  const fromCanvas = useCallback(
    (px: number, py: number, w: number, h: number) => {
      const innerW = w - PADDING * 2;
      const innerH = h - PADDING * 2;
      return {
        x: Math.max(0, Math.min(1, (px - PADDING) / innerW)),
        y: Math.max(0, Math.min(1, 1 - (py - PADDING) / innerH)),
      };
    },
    []
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const innerW = w - PADDING * 2;
    const innerH = h - PADDING * 2;

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    const gridCols = 10;
    const gridRows = 10;
    for (let i = 0; i <= gridCols; i++) {
      const x = PADDING + (i / gridCols) * innerW;
      ctx.beginPath();
      ctx.moveTo(x, PADDING);
      ctx.lineTo(x, PADDING + innerH);
      ctx.stroke();
    }
    for (let j = 0; j <= gridRows; j++) {
      const y = PADDING + (j / gridRows) * innerH;
      ctx.beginPath();
      ctx.moveTo(PADDING, y);
      ctx.lineTo(PADDING + innerW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING + innerH);
    ctx.lineTo(PADDING + innerW, PADDING + innerH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PADDING, PADDING);
    ctx.lineTo(PADDING, PADDING + innerH);
    ctx.stroke();

    ctx.fillStyle = '#888';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('0', PADDING, PADDING + innerH + 16);
    ctx.fillText('1', PADDING + innerW, PADDING + innerH + 16);
    ctx.textAlign = 'right';
    ctx.fillText('1', PADDING - 6, PADDING + 4);
    ctx.fillText('0', PADDING - 6, PADDING + innerH + 4);

    const points = pointsRef.current;

    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const pa = toCanvas(a.x, a.y, w, h);
        const pb = toCanvas(b.x, b.y, w, h);
        const pcp2 = toCanvas(a.cp2x, a.cp2y, w, h);
        const pcp1 = toCanvas(b.cp1x, b.cp1y, w, h);

        ctx.strokeStyle = '#7c5cff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pa.px, pa.py);
        ctx.bezierCurveTo(pcp2.px, pcp2.py, pcp1.px, pcp1.py, pb.px, pb.py);
        ctx.stroke();
      }
    }

    points.forEach((p, i) => {
      const pa = toCanvas(p.x, p.y, w, h);
      const p1 = toCanvas(p.cp1x, p.cp1y, w, h);
      const p2 = toCanvas(p.cp2x, p.cp2y, w, h);

      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pa.px, pa.py);
      ctx.lineTo(p1.px, p1.py);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pa.px, pa.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#ff9f43';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'transparent';
      const half = CP_SIZE / 2;
      ctx.strokeRect(p1.px - half, p1.py - half, CP_SIZE, CP_SIZE);
      ctx.strokeRect(p2.px - half, p2.py - half, CP_SIZE, CP_SIZE);

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#7c5cff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pa.px, pa.py, ANCHOR_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (i === 0) {
        ctx.fillStyle = '#aaa';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('0', pa.px, pa.py - ANCHOR_RADIUS - 4);
      }
      if (i === points.length - 1) {
        ctx.fillStyle = '#aaa';
        ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('1', pa.px, pa.py - ANCHOR_RADIUS - 4);
      }
    });
  }, [toCanvas]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
  };

  const hitTest = (px: number, py: number, w: number, h: number): DragTarget => {
    const points = pointsRef.current;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const p1 = toCanvas(p.cp1x, p.cp1y, w, h);
      const dx1 = px - p1.px;
      const dy1 = py - p1.py;
      if (Math.abs(dx1) <= CP_SIZE && Math.abs(dy1) <= CP_SIZE) {
        return { type: 'cp1', index: i };
      }
      const p2 = toCanvas(p.cp2x, p.cp2y, w, h);
      const dx2 = px - p2.px;
      const dy2 = py - p2.py;
      if (Math.abs(dx2) <= CP_SIZE && Math.abs(dy2) <= CP_SIZE) {
        return { type: 'cp2', index: i };
      }
    }
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const pa = toCanvas(p.x, p.y, w, h);
      const dx = px - pa.px;
      const dy = py - pa.py;
      if (dx * dx + dy * dy <= (ANCHOR_RADIUS + 2) * (ANCHOR_RADIUS + 2)) {
        return { type: 'anchor', index: i };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const { px, py, w, h } = getMousePos(e);
    const target = hitTest(px, py, w, h);
    if (target) {
      dragRef.current = target;
      const targetEl = e.target as HTMLCanvasElement;
      if ('setPointerCapture' in targetEl && typeof (e as unknown as { pointerId?: number }).pointerId === 'number') {
        targetEl.setPointerCapture((e as unknown as { pointerId: number }).pointerId);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const { px, py, w, h } = getMousePos(e);
    const { x, y } = fromCanvas(px, py, w, h);
    const { type, index } = dragRef.current;

    const newPoints = [...pointsRef.current];
    const p = { ...newPoints[index] };

    if (type === 'anchor') {
      p.x = Math.max(0, Math.min(1, x));
      p.y = Math.max(0, Math.min(1, y));
    } else if (type === 'cp1') {
      p.cp1x = x;
      p.cp1y = y;
    } else if (type === 'cp2') {
      p.cp2x = x;
      p.cp2y = y;
    }

    newPoints[index] = p;
    newPoints.sort((a, b) => a.x - b.x);

    pointsRef.current = newPoints;
    onChange(newPoints);
    draw();
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { px, py, w, h } = getMousePos(e);
    if (px < PADDING || px > w - PADDING || py < PADDING || py > h - PADDING) return;
    if (hitTest(px, py, w, h)) return;

    const { x, y } = fromCanvas(px, py, w, h);
    const newPoint: BezierPoint = {
      x,
      y,
      cp1x: Math.max(0, x - 0.1),
      cp1y: y,
      cp2x: Math.min(1, x + 0.1),
      cp2y: y,
    };

    const newPoints = [...pointsRef.current, newPoint].sort((a, b) => a.x - b.x);
    pointsRef.current = newPoints;
    onChange(newPoints);
    draw();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { px, py, w, h } = getMousePos(e);
    const target = hitTest(px, py, w, h);
    if (!target || target.type !== 'anchor') return;
    if (pointsRef.current.length <= 2) return;

    const newPoints = pointsRef.current.filter((_, i) => i !== target.index);
    pointsRef.current = newPoints;
    onChange(newPoints);
    draw();
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full select-none rounded-md bg-[#1a1a1a]', className)}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
