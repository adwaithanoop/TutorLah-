import { Star } from "lucide-react";
import { testimonials } from "../lib/mockData";

export default function Testimonials() {
  return (
    <section className="bg-indigo-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
            Student Stories
          </span>
          <h2 className="mt-6 font-serif text-3xl font-medium tracking-tight text-white sm:text-4xl lg:text-5xl">
            Grades improved. Confidence restored.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-indigo-100/80">
            Real feedback from NUS students who used TutorLah during their most
            stressful semesters.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* testimonial cards */}
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm sm:p-7"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>

              <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-indigo-100/80">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${t.avatarColor}`}
                >
                  <span className="text-sm font-bold text-white">{t.initials}</span>
                </div>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-indigo-200/70">{t.faculty}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
