"use client";

import { useRouter } from "next/navigation";
import ModuleCombobox, { type ModuleOption } from "@/app/components/ModuleCombobox";

export default function CheatsheetModulePicker({ modules }: { modules: ModuleOption[] }) {
  const router = useRouter();
  return (
    <ModuleCombobox
      modules={modules}
      onChange={(code) => {
        if (code) router.push(`/cheatsheets/${code}`);
      }}
      placeholder="Search a module — code or title"
    />
  );
}
