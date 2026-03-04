"use client";

import { useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface SliderWithInputProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
  format?: (v: number) => string;
  parse?: (s: string) => number;
  unit?: string;
  className?: string;
  markers?: number[];
}

export function SliderWithInput({
  min,
  max,
  step,
  value,
  onValueChange,
  format,
  parse,
  unit,
  className,
  markers,
}: SliderWithInputProps) {
  const [inputVal, setInputVal] = useState<string>("");
  const [editing, setEditing] = useState(false);

  const displayStr = format ? format(value) : String(value);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputVal(e.target.value);
    },
    []
  );

  const commitValue = useCallback(() => {
    setEditing(false);
    const raw = inputVal.trim().toLowerCase().replace(/k$/, "000").replace(/[^0-9.]/g, "");
    const parsed = parse ? parse(inputVal) : parseFloat(raw);
    if (!isNaN(parsed)) {
      // Snap to nearest step within bounds
      const snapped = Math.round(Math.max(min, Math.min(max, parsed)) / step) * step;
      onValueChange(snapped);
    }
    setInputVal("");
  }, [inputVal, min, max, step, parse, onValueChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitValue();
    if (e.key === "Escape") {
      setEditing(false);
      setInputVal("");
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([v]) => onValueChange(v)}
          className="flex-1"
        />
        {/* Editable badge */}
        <div className="relative flex-shrink-0">
          {editing ? (
            <input
              autoFocus
              type="text"
              defaultValue={displayStr}
              onChange={handleInputChange}
              onBlur={commitValue}
              onKeyDown={handleKeyDown}
              className={cn(
                "h-7 w-24 rounded-md border border-primary bg-primary/10 px-2 text-xs font-mono text-primary text-right",
                "focus:outline-none focus:ring-1 focus:ring-primary"
              )}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setInputVal(displayStr);
              }}
              title="Click to type a value"
              className={cn(
                "h-7 min-w-[4.5rem] rounded-md border border-primary/30 bg-primary/10 px-2 text-xs font-mono text-primary",
                "hover:border-primary hover:bg-primary/20 transition-colors text-right cursor-text"
              )}
            >
              {displayStr}
              {unit && <span className="ml-0.5 text-primary/70">{unit}</span>}
            </button>
          )}
        </div>
      </div>
      {markers && (
        <div className="flex justify-between text-[10px] text-muted-foreground pr-[6.5rem]">
          {markers.map((m) => (
            <span key={m}>{format ? format(m) : m}</span>
          ))}
        </div>
      )}
    </div>
  );
}
