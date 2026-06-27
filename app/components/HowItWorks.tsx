import RoleToggle from "./RoleToggle";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            How It Works
          </span>
          <h2 className="mt-5 font-serif text-3xl font-medium tracking-tight text-indigo-950 sm:text-4xl lg:text-5xl">
            From search to session in minutes
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-indigo-900/70">
            Whether you&apos;re looking for help or offering it, the process is
            designed to be fast, transparent, and accountable at every step.
          </p>
        </div>

        <div className="mt-16 sm:mt-20">
          {/* steps, toggles student vs tutor */}
          <RoleToggle />
        </div>
      </div>
    </section>
  );
}
