// first letters of the name
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function Avatar({
  src,
  name,
  colorClass,
  className = "",
  textClass = "",
}: {
  src?: string | null;
  name: string;
  colorClass: string;
  className?: string;
  textClass?: string;
}) {
  // real photo if we have one, otherwise colored initials
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are remote Supabase objects, served at their stored size
      <img src={src} alt={name} className={`rounded-full object-cover ${className}`} />
    );
  }
  return (
    <span
      className={`flex items-center justify-center rounded-full font-bold text-white ${colorClass} ${textClass} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
