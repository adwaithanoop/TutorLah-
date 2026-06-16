const MODULE_ASSESSMENTS: Record<string, readonly string[]> = {
  CS1101S: [
    "Reading Assessment 1",
    "Midterms",
    "Practical Assessment",
    "Reading Assessment 2",
    "Finals",
  ],
  CS2030S: ["Practical Examination 1", "Midterms", "Practical Examination 2", "Finals"],
};

export const GENERIC_ASSESSMENTS = [
  "Midterms",
  "Practical Assessment",
  "Finals",
  "Quiz",
  "Other",
] as const;

function listFor(moduleCode: string): readonly string[] {
  return MODULE_ASSESSMENTS[moduleCode.toUpperCase()] ?? GENERIC_ASSESSMENTS;
}

export function getAssessments(moduleCode: string): string[] {
  return [...listFor(moduleCode)];
}

export function assessmentRank(moduleCode: string, label: string): number {
  const list = listFor(moduleCode);
  const idx = list.indexOf(label);
  return idx === -1 ? list.length : idx;
}
