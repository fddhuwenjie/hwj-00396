import React, { useRef, useState } from 'react';
import { ColorStop } from '../types';
import { sampleColorGradient } from '../utils/bezier';
import { cn } from '../lib/utils';

interface ColorGradientEditorProps {
  value: ColorStop[];
  onChange: (stops: ColorStop[]) => void;
  height?: number;
  className?: string;
}

function stopsToGradient(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.t - b.t);
  return `linear-gradient(to right, ${sorted
    .map((s) => `${s.color} ${(s.t * 100).toFixed(2)}%`)
    .join(', ')})`;
}

function rgbaToHex(rgba: [number, number, number, number]): string {
  const [r, g, b] = rgba;
  const toHex = (v: number) => {
    const h = Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
    return h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorGradientEditor({
  value,
  onChange,
  height = 48,
  className,
}: ColorGradientEditorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const colorInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const sortedStops = React.useMemo(
    () => [...value].sort((a, b) => a.t - b.t),
    [value]
  );

  const getTFromEvent = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handleBarDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const t = getTFromEvent(e.clientX);
    const rgba = sampleColorGradient(value, t);
    const hex = rgbaToHex(rgba);
    const newStops = [...value, { t, color: hex }];
    onChange(newStops);
  };

  const handleHandleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDraggingIndex(index);

    const handleMouseMove = (ev: MouseEvent) => {
      const t = getTFromEvent(ev.clientX);
      const newStops = value.map((s, i) => (i === index ? { ...s, t } : s));
      onChange(newStops);
    };

    const handleMouseUp = () => {
      setDraggingIndex(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (value.length <= 2) return;
    const newStops = value.filter((_, i) => i !== index);
    onChange(newStops);
  };

  const handleColorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newStops = value.map((s, i) =>
      i === index ? { ...s, color: e.target.value } : s
    );
    onChange(newStops);
  };

  const openColorPicker = (index: number) => {
    const input = colorInputRefs.current.get(index);
    if (input) input.click();
  };

  return (
    <div className={cn('w-full select-none', className)}>
      <div
        ref={trackRef}
        className="relative w-full rounded-md border border-[#333] overflow-hidden cursor-pointer"
        style={{ height }}
        onDoubleClick={handleBarDoubleClick}
      >
        <div
          className="h-full w-full"
          style={{ background: stopsToGradient(value) }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            opacity: 0.25,
            zIndex: -1,
          }}
        />
      </div>

      <div className="relative w-full mt-1" style={{ height: 32 }}>
        {sortedStops.map((stop, i) => {
          const originalIndex = value.findIndex(
            (s) => s.t === stop.t && s.color === stop.color
          );
          const idx = originalIndex >= 0 ? originalIndex : i;
          return (
            <div
              key={`${stop.t}-${stop.color}-${i}`}
              className={cn(
                'absolute -translate-x-1/2 cursor-grab active:cursor-grabbing group',
                draggingIndex === idx && 'z-20'
              )}
              style={{ left: `${stop.t * 100}%`, top: 0 }}
              onMouseDown={(e) => handleHandleMouseDown(e, idx)}
              onContextMenu={(e) => handleContextMenu(e, idx)}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: stop.color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openColorPicker(idx);
                    }}
                  />
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 border-white shadow-md transition-transform',
                      draggingIndex === idx && 'scale-125'
                    )}
                    style={{ backgroundColor: stop.color }}
                  />
                </div>
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '6px solid #fff',
                  }}
                />
                <input
                  ref={(el) => {
                    if (el) colorInputRefs.current.set(idx, el);
                  }}
                  type="color"
                  className="sr-only"
                  value={stop.color}
                  onChange={(e) => handleColorChange(e, idx)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {sortedStops.map((stop, i) => (
          <div
            key={`info-${stop.t}-${stop.color}-${i}`}
            className="flex items-center gap-2 text-xs text-[#aaa] bg-[#1a1a1a] rounded px-2 py-1"
          >
            <span className="text-[#888]">t:</span>
            <span className="font-mono text-white">{stop.t.toFixed(2)}</span>
            <span className="text-[#888]">c:</span>
            <span className="font-mono uppercase text-white">
              {stop.color}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
