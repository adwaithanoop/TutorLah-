"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import ModuleCombobox, { type ModuleOption } from "@/app/components/ModuleCombobox";

export default function DashboardModuleSearch({
  modules,
  initialModule = "",
}: {
  modules: ModuleOption[];
  initialModule?: string;
}) {
  const router = useRouter();
  const [moduleCode, setModuleCode] = useState(initialModule);

  // jump to the dashboard for a module
  function go(code: string) {
    if (!code) return;
    router.push(`/dashboard?module=${encodeURIComponent(code)}`);
  }

  return (
    <div className="mt-5 flex max-w-md gap-2">
      <div className="flex-1">
        <ModuleCombobox
          modules={modules}
          defaultValue={initialModule}
          onChange={(code) => {
            setModuleCode(code);
            if (code) go(code);
          }}
          placeholder="Search by module code or title"
          inputClassName="w-full rounded-lg border border-transparent bg-white/95 px-3.5 py-2.5 text-sm text-indigo-950 placeholder-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-white/60"
        />
      </div>
      <button
        type="button"
        onClick={() => go(moduleCode)}
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
      >
        <Search className="h-4 w-4" strokeWidth={2.5} />
        Search
      </button>
    </div>
  );
}
