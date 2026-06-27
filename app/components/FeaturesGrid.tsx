type Feature = {
  title: string;
  description: string;
  highlight: boolean;
  span: string;
};

// feature cards
const features: Feature[] = [
  {
    title: "Verified Module Badges",
    description:
      "Tutors upload transcripts to earn verified badges for specific modules. Each badge shows their actual grade: A, A+, or A-minus, so you know exactly who you're getting.",
    highlight: true,
    span: "lg:col-span-4",
  },
  {
    title: "5-Factor Reliability Score",
    description:
      "A weighted algorithm combining satisfaction ratings, task completion rate, verification status, module grade, and recency. Updated after every session to keep rankings honest.",
    highlight: true,
    span: "lg:col-span-2",
  },
  {
    title: "SOS Instant Bidding",
    description:
      "Stuck at 11 PM? Post an SOS request with your module and problem. Active tutors will state their offers, you pick your favourite.",
    highlight: false,
    span: "lg:col-span-2",
  },
  {
    title: "Group Session Seminars",
    description:
      "Tutors host revision seminars. Or post a group request and let tutors bid for you.",
    highlight: false,
    span: "lg:col-span-4",
  },
  {
    title: "Academic Passport",
    description:
      "Your learnnig progress is updated by each tutor onto your Academic Passport after every session, allowing future tutors to continue where your previous tutor left off should you choose to find a different tutor.",
    highlight: false,
    span: "lg:col-span-3",
  },
  {
    title: "Protected Payments",
    description:
      "Your money is held securely until the session is complete and a report is submitted, then paid to the tutor. Built-in dispute resolution protects both sides.",
    highlight: false,
    span: "lg:col-span-3",
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="bg-indigo-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
            Platform Features
          </span>
          <h2 className="mt-6 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Built for how NUS students actually study
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-indigo-100/80">
            Every feature was designed to solve a specific pain point, from
            finding a credible tutor to protecting your payment and building
            long-term academic momentum.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:mt-20 sm:grid-cols-2 lg:grid-cols-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-xl bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10 sm:p-7 ${feature.span} ${
                feature.highlight ? "ring-1 ring-sky-400/40" : "ring-1 ring-white/10"
              }`}
            >
              <h3 className="text-base font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
