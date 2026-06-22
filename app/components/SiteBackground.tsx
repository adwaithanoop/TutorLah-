import { backgroundUrl, type BackgroundName } from "@/lib/backgrounds";

type SiteBackgroundProps = {
  name: BackgroundName;
  overlayClassName?: string;
  className?: string;
};

export default function SiteBackground({
  name,
  overlayClassName = "bg-indigo-950/60",
  className = "",
}: SiteBackgroundProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${backgroundUrl(name)}")` }}
      />
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}
