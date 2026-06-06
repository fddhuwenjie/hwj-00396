import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

function formatValue(v: number, step: number): string {
  const decimals = step < 1 ? String(step).split('.')[1]?.length || 2 : 0;
  return v.toFixed(decimals);
}

export default function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  unit,
  className,
}: SliderProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(formatValue(value, step));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setInputValue(formatValue(value, step));
    }
  }, [value, step, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) {
      onChange(Math.max(min, Math.min(max, v)));
    }
  };

  const handleValueClick = () => {
    setEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const commitInput = () => {
    const v = parseFloat(inputValue);
    if (!isNaN(v)) {
      onChange(Math.max(min, Math.min(max, v)));
    }
    setEditing(false);
  };

  const handleInputBlur = () => {
    commitInput();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitInput();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  const percentage =
    max !== min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-3 w-full', className)}>
      <span className="text-sm text-[#ccc] min-w-[80px] shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 relative h-6 flex items-center">
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="h-1.5 w-full rounded-full bg-[#2a2a2a] overflow-hidden">
            <div
              className="h-full bg-[#7c5cff] rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-[#7c5cff]
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-[#7c5cff]
            [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:active:cursor-grabbing"
        />
      </div>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-20 h-7 bg-[#2a2a2a] border border-[#7c5cff] rounded px-2 text-sm text-white text-right font-mono focus:outline-none"
        />
      ) : (
        <div
          onClick={handleValueClick}
          className="w-20 h-7 flex items-center justify-end px-2 rounded bg-[#1a1a1a] border border-[#333] text-sm text-white font-mono cursor-pointer hover:border-[#555] transition-colors"
        >
          {formatValue(value, step)}
          {unit && <span className="text-[#888] ml-1 text-xs">{unit}</span>}
        </div>
      )}
    </div>
  );
}
