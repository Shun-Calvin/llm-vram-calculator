"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  /** Max height of the dropdown in px */
  maxHeight?: number;
  /** Group options by returning a group key string from an option value */
  getGroup?: (value: string) => string | undefined;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  triggerClassName,
  disabled,
  maxHeight = 320,
  getGroup,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, query]);

  // Group filtered options
  const grouped = React.useMemo(() => {
    if (!getGroup) return null;
    const map = new Map<string, SearchableOption[]>();
    for (const opt of filtered) {
      const g = getGroup(opt.value) ?? "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(opt);
    }
    return map;
  }, [filtered, getGroup]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
    if (e.key === "Enter" && filtered.length === 1) {
      handleSelect(filtered[0].value);
    }
  };

  const renderOptions = (opts: SearchableOption[]) =>
    opts.map((opt) => (
      <button
        key={opt.value}
        type="button"
        disabled={opt.disabled}
        onClick={() => handleSelect(opt.value)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          opt.value === value && "bg-primary/10 text-primary",
          opt.disabled && "opacity-40 pointer-events-none"
        )}
      >
        <span className="w-4 h-4 flex-shrink-0">
          {opt.value === value && <Check className="w-3.5 h-3.5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate">{opt.label}</span>
          {opt.sublabel && (
            <span className="block text-[10px] text-muted-foreground truncate">
              {opt.sublabel}
            </span>
          )}
        </span>
        {opt.badge && <span className="flex-shrink-0">{opt.badge}</span>}
      </button>
    ));

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 h-8 rounded-md border border-border bg-secondary text-sm",
          "hover:bg-muted/60 transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
          disabled && "opacity-50 pointer-events-none",
          triggerClassName
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 text-left truncate">
          {selected ? (
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{selected.label}</span>
              {selected.badge && <span className="flex-shrink-0">{selected.badge}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-popover shadow-xl",
            "overflow-hidden flex flex-col"
          )}
          style={{ maxHeight }}
          role="listbox"
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto p-1 flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">
                No results for &quot;{query}&quot;
              </p>
            ) : grouped ? (
              Array.from(grouped.entries()).map(([group, opts]) => (
                <div key={group}>
                  {group && (
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group}
                    </p>
                  )}
                  {renderOptions(opts)}
                </div>
              ))
            ) : (
              renderOptions(filtered)
            )}
          </div>

          {filtered.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border bg-muted/20">
              <p className="text-[10px] text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                {query && ` for "${query}"`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
