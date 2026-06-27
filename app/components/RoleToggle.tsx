"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

type Step = {
  number: string;
  title: string;
  description: string;
};

// student flow steps
const studentSteps: Step[] = [
  {
    number: "01",
    title: "Search by Module Code",
    description:
      "Enter any NUS module code, and see a ranked list of verified tutors who have actually taken and done well for that course.",
  },
  {
    number: "02",
    title: "Review Profiles & Reliability Scores",
    description:
      "Each tutor profile shows their verified module grades, a 5-Factor Reliability Score, past session reviews, and completion rate, with no guesswork.",
  },
  {
    number: "03",
    title: "Book & Pay Securely",
    description:
      "Select a time slot from mutual availability, agree on a rate, and confirm. Your payment is held safely until the session is completed.",
  },
  {
    number: "04",
    title: "Build Your Academic Passport",
    description:
      "After each session, your tutor submits a structured report. All reports aggregate into your Academic Passport, a persistent log of your progress future tutors can use to skip the diagnostic phase.",
  },
];

// tutor flow steps
const tutorSteps: Step[] = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Sign up with your @u.nus.edu email. Upload transcripts to earn verified module badges. Set your rates and availability.",
  },
  {
    number: "02",
    title: "Get Discovered",
    description:
      "Your profile appears in module-specific searches. Students filter by grade, score, and rate. Your Reliability Score rises with every successful session.",
  },
  {
    number: "03",
    title: "Respond to SOS Bids",
    description:
      "Toggle Active to receive real-time SOS notifications for your verified modules. Submit a bid with your rate, and the student picks the best offer.",
  },
  {
    number: "04",
    title: "Complete & Get Paid",
    description:
      "Submit your session report to unlock payment. The student's held payment is transferred to you once the report is filed and the time-lock passes.",
  },
];

export default function RoleToggle() {
  // which set of steps to show
  const [role, setRole] = useState<"student" | "tutor">("student");
  const steps = role === "student" ? studentSteps : tutorSteps;

  return (
    <div>
      <div className="mb-14 flex justify-center">
        <div className="inline-flex rounded-full bg-indigo-50 p-1.5 ring-1 ring-indigo-100">
          {(["student", "tutor"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-full px-7 py-2.5 text-sm font-semibold transition-all duration-200 ${
                role === r
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-indigo-900/50 hover:text-indigo-700"
              }`}
            >
              {r === "student" ? "For Students" : "For Tutors"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div key={step.number} className="relative flex flex-col">
            {i < steps.length - 1 && (
              <div className="absolute left-full top-9 z-0 hidden h-px w-full -translate-x-4 bg-gradient-to-r from-indigo-200 to-transparent lg:block" />
            )}

            <div className="relative z-10 flex h-full flex-col rounded-xl bg-white p-6 shadow-soft-lg sm:p-7">
              <span className="mb-5 font-mono text-3xl font-bold text-indigo-600">
                {step.number}
              </span>

              <h3 className="mb-2 text-lg font-bold tracking-tight text-indigo-950">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-indigo-900/70">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <a
          href="/auth/signup"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-soft transition-all hover:bg-indigo-700 hover:shadow-soft-lg"
        >
          {role === "student" ? "Find a Tutor Now" : "Start Earning Today"}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}
