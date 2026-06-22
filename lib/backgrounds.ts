const BUCKET = "backgrounds";

// Logical slot -> object path inside the public `backgrounds` storage bucket.
// To set a background, upload a file at the matching path in Supabase Storage.
// Until a file exists the URL 404s and the call site's fallback colour shows.
export const BACKGROUNDS = {
  hero: "hero.jpg",
  auth: "auth.jpg",
  appStudent: "app-student.jpg",
  appTutor: "app-tutor.jpg",
  dashboardSearch: "dashboard-search.jpg",
} as const;

export type BackgroundName = keyof typeof BACKGROUNDS;

export function backgroundUrl(name: BackgroundName): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${BUCKET}/${BACKGROUNDS[name]}`;
}
