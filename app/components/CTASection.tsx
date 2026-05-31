import Link from "next/link";

const guarantees = [
  "NUS email required",
  "Free to sign up",
  "Sign in with your NUS email",
];

export default function CTASection() {
  return (
    <section className="bg-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-indigo-950 px-8 py-16 text-center shadow-bold sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:22px_22px]"
          />

          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
            Get started today
          </span>

          <h2 className="mx-auto mt-6 max-w-2xl font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to ace <span className="italic text-sky-300">your modules?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-indigo-100/80">
            Join hundreds of NUS students who found the right tutor: verified,
            reliable, and module-specific, in under 10 minutes.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="rounded-full bg-accent px-8 py-4 font-semibold text-accent-ink shadow-soft transition-all hover:bg-accent-strong hover:text-white hover:shadow-soft-lg"
            >
              Find a Tutor Now
            </Link>
            <Link
              href="/auth/signup?role=tutor"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              Become a Tutor
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {guarantees.map((g) => (
              <div key={g} className="flex items-center gap-2 text-sm text-indigo-100/70">
                <span className="text-sky-300">✓</span>
                {g}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
