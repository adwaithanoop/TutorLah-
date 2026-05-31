"use client";

import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { mockTutors, popularModules } from "../lib/mockData";

export default function ModuleSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTutors = query.trim()
    ? mockTutors.filter((t) =>
        t.modules.some((m) =>
          m.code.toLowerCase().includes(query.toLowerCase())
        )
      )
    : [];

  const matchedModules = query.trim()
    ? popularModules.filter((m) =>
        m.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const showDropdown =
    focused && query.trim().length > 0 && (filteredTutors.length > 0 || matchedModules.length > 0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50";
    if (score >= 80) return "text-amber-600 bg-amber-50";
    return "text-orange-600 bg-orange-50";
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div
        className={`flex items-center bg-white rounded-full shadow-soft-lg overflow-hidden transition-all duration-200 ${
          focused ? "ring-2 ring-indigo-500" : "ring-1 ring-indigo-100"
        }`}
      >
        <div className="pl-5 pr-2 text-indigo-300">
          <Search className="w-5 h-5" strokeWidth={2} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search by module code (e.g. CS2040S)"
          className="flex-1 py-3.5 px-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none bg-transparent"
          autoComplete="off"
        />

        <Link
          query={query}
          className="m-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
        >
          Find Tutors
        </Link>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
          {matchedModules.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                Modules
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchedModules.slice(0, 6).map((mod) => (
                  <button
                    key={mod}
                    onClick={() => setQuery(mod)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-mono font-semibold rounded-md transition-colors"
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredTutors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1.5">
                Matching Tutors
              </p>
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${tutor.avatarColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white text-xs font-bold">
                      {tutor.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {tutor.name}
                      </p>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${scoreColor(tutor.reliabilityScore)}`}
                      >
                        ★ {tutor.reliabilityScore}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {tutor.modules
                        .filter((m) =>
                          m.code.toLowerCase().includes(query.toLowerCase())
                        )
                        .map((m) => (
                          <span
                            key={m.code}
                            className="text-xs font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded"
                          >
                            {m.code} · {m.grade}
                          </span>
                        ))}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    ${tutor.ratePerHour}/hr
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Press Enter to see all results for{" "}
              <span className="font-mono font-semibold text-indigo-600">
                {query}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Link({
  query,
  className,
  children,
}: {
  query: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`/tutors?module=${encodeURIComponent(query)}`} className={className}>
      {children}
    </a>
  );
}
