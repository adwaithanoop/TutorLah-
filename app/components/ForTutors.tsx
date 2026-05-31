import { ArrowRight } from "lucide-react";

type Benefit = { title: string; description: string };

const benefits: Benefit[] = [
  {
    title: "Earn on your own schedule",
    description:
      "Set your own rates and availability. Take sessions when you want, decline when you don't. No commitment, no quota.",
  },
  {
    title: "Your grade is your credential",
    description:
      "Upload your transcript and your verified A+ in CS2040S becomes a badge on your profile. Students trust verified tutors, and verified tutors get booked first.",
  },
  {
    title: "Your score compounds over time",
    description:
      "Every session you complete in good standing raises your Reliability Score, pushing you higher in search results. Consistency pays off, literally.",
  },
  {
    title: "Guaranteed payment, always",
    description:
      "Student funds are escrowed before the session starts. Once you complete and file your report, you get paid. No chasing, no awkwardness.",
  },
];

const mockEarnings = [
  { label: "CS2040S", sessions: 12, rate: 35, color: "bg-indigo-600" },
  { label: "CS2030S", sessions: 8, rate: 32, color: "bg-violet-500" },
  { label: "CS1231S", sessions: 5, rate: 28, color: "bg-indigo-300" },
];

export default function ForTutors() {
  const totalMonthly = mockEarnings.reduce(
    (sum, e) => sum + e.sessions * e.rate,
    0
  );

  return (
    <section id="for-tutors" className="bg-cream py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
              For Tutors
            </span>
            <h2 className="mt-4 font-serif text-3xl font-medium tracking-tight text-indigo-950 sm:text-4xl lg:text-5xl">
              Turn your A&apos;s into income.{" "}
              <span className="italic text-sky-600">On your terms.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-indigo-900/70">
              You already did the hard work getting that grade. TutorLah
              lets you monetize that expertise while helping juniors who are
              exactly where you were a year ago.
            </p>

            <div className="mt-10 space-y-6 border-l border-indigo-100 pl-6">
              {benefits.map((b) => (
                <div key={b.title}>
                  <h3 className="font-semibold text-indigo-950">{b.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-900/70">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>

            <a
              href="/auth/signup?role=tutor"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-soft transition-all hover:bg-indigo-700 hover:shadow-soft-lg"
            >
              Become a Tutor
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </a>
          </div>

          <div>
            <div className="rounded-xl bg-white p-6 shadow-soft-lg sm:p-7">
              <div className="mb-6">
                <p className="text-sm font-medium text-indigo-900/70">
                  Estimated Monthly Earnings
                </p>
                <p className="mt-1 text-4xl font-black text-indigo-950">
                  ${totalMonthly}
                  <span className="text-lg font-medium text-indigo-900/40">
                    /mo
                  </span>
                </p>
              </div>

              <div className="mb-6 space-y-3">
                {mockEarnings.map((e) => (
                  <div key={e.label} className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 flex-shrink-0 rounded-full ${e.color}`}
                    />
                    <span className="w-20 font-mono text-sm font-semibold text-indigo-900/80">
                      {e.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-indigo-50">
                      <div
                        className={`h-full rounded-full ${e.color}`}
                        style={{ width: `${(e.sessions / 15) * 100}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-sm text-indigo-900/50">
                      {e.sessions} sessions × ${e.rate}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-cream-2 p-4 text-center">
                <p className="mb-1 text-xs text-indigo-900/40">
                  Based on 25 sessions/month · avg $33/hr
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  ↑ Top tutors earn $1,200+/month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
