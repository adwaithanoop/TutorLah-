const stats = [
  {
    value: "500+",
    label: "Verified Tutors",
    sub: "Across SoC, FoS, BIZ, and more",
  },
  {
    value: "120+",
    label: "NUS Modules Covered",
    sub: "From CS1010S to graduate-level",
  },
  {
    value: "4.8★",
    label: "Average Session Rating",
    sub: "Out of 5.0 across all sessions",
  },
  {
    value: "97%",
    label: "Completion Rate",
    sub: "Sessions completed without dispute",
  },
];

export default function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-indigo-950 py-24 sm:py-28">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.06) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200 bg-white/10 px-3 py-1 rounded-full">
            By the numbers
          </span>
          <h2 className="mt-5 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Built for NUS. Growing every semester.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-indigo-100/80">
            Real numbers from a platform designed around academic accountability,
            not just marketplace convenience.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/5 p-6 text-center shadow-soft-lg ring-1 ring-white/10 backdrop-blur-sm sm:p-7"
            >
              <p className="mb-1 text-4xl font-black text-white sm:text-5xl">
                {stat.value}
              </p>
              <p className="mb-1 text-sm font-semibold text-indigo-100">
                {stat.label}
              </p>
              <p className="text-xs text-indigo-300">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
