"use client";

import { useEffect, useId, useRef, useState } from "react";

interface TimeOption {
  value: string;
  label: string;
}

function buildOptions(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let m = 0; m < 24 * 60; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const value = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const period = h < 12 ? "AM" : "PM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const label = `${h12}:${String(min).padStart(2, "0")} ${period}`;
    opts.push({ value, label });
  }
  return opts;
}

const OPTIONS = buildOptions();
const LABEL_BY_VALUE = new Map(OPTIONS.map((o) => [o.value, o.label]));

// Forgiving match: "715", "7:15", "7 15 pm" all narrow to the right slots.
function matchTime(label: string, query: string): boolean {
  const compact = label.toLowerCase().replace(/[\s:]/g, "");
  const tokens = query.toLowerCase().split(/[\s:]+/).filter(Boolean);
  return tokens.every((t) => compact.includes(t));
}

export default function TimeCombobox({
  value,
  onChange,
  placeholder = "Select a time",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState(LABEL_BY_VALUE.get(value) ?? "");
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const matches =
    filtering && query.trim() ? OPTIONS.filter((o) => matchTime(o.label, query)) : OPTIONS;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setQuery(LABEL_BY_VALUE.get(value) ?? "");
        setOpen(false);
        setFiltering(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    const target = value || "09:00";
    const idx = OPTIONS.findIndex((o) => o.value === target);
    setActive(idx >= 0 ? idx : 0);
    setFiltering(false);
    setOpen(true);
  }

  function commit(o: TimeOption) {
    onChange(o.value);
    setQuery(o.label);
    setOpen(false);
    setFiltering(false);
  }

  function handleChange(text: string) {
    setQuery(text);
    setFiltering(true);
    setOpen(true);
    setActive(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && matches[active]) {
      e.preventDefault();
      commit(matches[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery(LABEL_BY_VALUE.get(value) ?? "");
      setOpen(false);
      setFiltering(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => {
          e.currentTarget.select();
          openList();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-soft-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3.5 py-2 text-sm text-gray-500">No matching time</li>
          ) : (
            matches.map((o, i) => (
              <li key={o.value}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(o)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm ${
                    i === active ? "bg-indigo-50" : ""
                  } ${o.value === value ? "font-semibold text-indigo-700" : "text-gray-700"}`}
                >
                  {o.label}
                  {o.value === value && <span className="text-indigo-600">✓</span>}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
