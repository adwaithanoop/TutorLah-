import ModuleSearch from "./ModuleSearch";
import SiteBackground from "./SiteBackground";

// quick search chips
const popularModules = ["CS2040S", "CS1231S", "MA1521", "ST2334", "CS2030S"];

// trust numbers under the hero
const trustStats = [
  { value: "500+", label: "Verified Tutors" },
  { value: "120+", label: "NUS Modules" },
  { value: "4.8★", label: "Avg. Rating" },
];

export default function HeroSection() {
  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-indigo-950">
      <SiteBackground
        name="hero"
        overlayClassName="bg-gradient-to-r from-indigo-950 via-indigo-950/85 to-indigo-950/45"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Peer tutoring that{" "}
            <span className="italic text-sky-300">actually knows</span> your syllabus.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/85">
            Connect with quality assured senior student-tutors, ranked by a 5-Factor
            Reliability Score, available on demand.
          </p>

          <div className="mt-8">
            <ModuleSearch />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="self-center text-xs font-medium text-indigo-200/80">Popular:</span>
            {popularModules.map((mod) => (
              <a
                key={mod}
                href={`/dashboard?module=${mod}`}
                className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {mod}
              </a>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-6">
            {trustStats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6">
                {i > 0 && <span className="h-10 w-px bg-white/20" />}
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold text-white">{stat.value}</span>
                  <span className="text-xs text-indigo-200/70">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
