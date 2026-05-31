import Link from "next/link";
import MagicLinkForm from "./MagicLinkForm";

const ERROR_MESSAGES: Record<string, string> = {
  domain: "That account isn't an @u.nus.edu address. TutorLah is NUS-only for now.",
  link: "That sign-in link was invalid or has expired. Request a new one below.",
};

const VALUE_BULLETS = [
  "Verified module badges",
  "5-Factor Reliability Score",
  "Escrow-protected payments",
];

export default function AuthCard({
  title,
  subtitle,
  asTutor = false,
  next,
  errorCode,
  footer,
}: {
  title: string;
  subtitle: string;
  asTutor?: boolean;
  next?: string;
  errorCode?: string;
  footer: React.ReactNode;
}) {
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : undefined;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-indigo-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="relative text-2xl font-extrabold tracking-tight text-white">
          Tutor<span className="text-sky-300">Lah</span>
        </Link>

        <div className="relative flex flex-col gap-8">
          <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Peer tutoring that knows your modules.
          </h2>
          <ul className="flex flex-col gap-4">
            {VALUE_BULLETS.map((bullet) => (
              <li
                key={bullet}
                className="flex items-center gap-3 text-lg leading-relaxed text-indigo-100/80"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-sky-300 ring-1 ring-white/10">
                  +
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 block text-center text-2xl font-extrabold tracking-tight text-indigo-950"
          >
            Tutor<span className="text-sky-500">Lah</span>
          </Link>

          <div className="rounded-2xl bg-white p-8 shadow-soft-lg">
            <h1 className="text-2xl font-bold tracking-tight text-indigo-950">{title}</h1>
            <p className="mt-1.5 mb-6 text-sm text-indigo-900/70">{subtitle}</p>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <MagicLinkForm next={next} asTutor={asTutor} />

            <p className="mt-6 text-center text-sm text-indigo-900/70">{footer}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
