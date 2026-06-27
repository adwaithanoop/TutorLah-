"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface ModuleOption {
  code: string;
  title: string;
}

// default input styling
const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export default function ModuleCombobox({
  modules,
  onChange,
  placeholder = "Search module code or title",
  inputClassName = INPUT_CLASS,
  defaultValue = "",
}: {
  modules: ModuleOption[];
  onChange: (code: string) => void;
  placeholder?: string;
  inputClassName?: string;
  defaultValue?: string;
}) {
  // query text plus the committed selection
  const [query, setQuery] = useState(defaultValue);
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  // top 8 matches for the query
  const q = query.trim().toLowerCase();
  const matches = (
    q ? modules.filter((m) => m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)) : modules
  ).slice(0, 8);

  // close and reset to the selection when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [selected]);

  // pick a module
  function commit(m: ModuleOption) {
    setSelected(m.code);
    setQuery(m.code);
    onChange(m.code);
    setOpen(false);
  }

  // typing clears any prior pick
  function handleChange(text: string) {
    setQuery(text);
    setOpen(true);
    setActive(0);
    if (selected) {
      setSelected("");
      onChange("");
    }
  }

  // arrow keys to move, enter to pick, escape to close
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
      setOpen(false);
      setQuery(selected);
    }
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={inputClassName}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-soft-lg"
        >
          {matches.length === 0 ? (
            <li className="px-3.5 py-2.5 text-sm text-gray-500">No matching module</li>
          ) : (
            matches.map((m, i) => (
              <li key={m.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(m)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-baseline gap-2 px-3.5 py-2.5 text-left ${
                    i === active ? "bg-indigo-50" : ""
                  }`}
                >
                  <span className="font-mono text-sm font-semibold text-indigo-700">{m.code}</span>
                  <span className="truncate text-sm text-gray-500">{m.title}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}