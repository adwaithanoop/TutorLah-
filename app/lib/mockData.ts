export interface TutorModule {
  code: string;
  grade: "A+" | "A" | "A-";
}

export interface Tutor {
  id: number;
  name: string;
  initials: string;
  year: string;
  faculty: string;
  modules: TutorModule[];
  reliabilityScore: number;
  ratePerHour: number;
  sessionsCompleted: number;
  reviewCount: number;
  latestReview: string;
  avatarColor: string;
  isActive: boolean;
}

export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  faculty: string;
  initials: string;
  avatarColor: string;
}

export const mockTutors: Tutor[] = [
  {
    id: 1,
    name: "Aiden Tan",
    initials: "AT",
    year: "Year 3",
    faculty: "Computer Science",
    modules: [
      { code: "CS2040S", grade: "A+" },
      { code: "CS2030S", grade: "A+" },
      { code: "CS3230", grade: "A" },
    ],
    reliabilityScore: 94.2,
    ratePerHour: 35,
    sessionsCompleted: 47,
    reviewCount: 42,
    latestReview:
      "Explained trees and graph traversals in a way that finally clicked. Best CS2040S tutor I've had.",
    avatarColor: "bg-indigo-500",
    isActive: true,
  },
  {
    id: 2,
    name: "Priya Sharma",
    initials: "PS",
    year: "Year 2",
    faculty: "Data Science & Analytics",
    modules: [
      { code: "MA1521", grade: "A+" },
      { code: "ST2334", grade: "A+" },
      { code: "MA2001", grade: "A" },
    ],
    reliabilityScore: 91.8,
    ratePerHour: 28,
    sessionsCompleted: 31,
    reviewCount: 28,
    latestReview:
      "Super patient with probability concepts. My ST2334 exam prep was so much better with her.",
    avatarColor: "bg-violet-500",
    isActive: true,
  },
  {
    id: 3,
    name: "Marcus Lim",
    initials: "ML",
    year: "Year 3",
    faculty: "Computer Science",
    modules: [
      { code: "CS1231S", grade: "A+" },
      { code: "CS2040S", grade: "A" },
      { code: "CS2100", grade: "A+" },
    ],
    reliabilityScore: 88.5,
    ratePerHour: 30,
    sessionsCompleted: 23,
    reviewCount: 20,
    latestReview:
      "Really solid on discrete maths. Made proof techniques much clearer. Worth every dollar.",
    avatarColor: "bg-emerald-500",
    isActive: false,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "Found a CS2040S tutor within 20 minutes at 11 PM during finals week. The SOS feature literally saved my grade.",
    name: "Ryan Ng",
    faculty: "Year 1, Computer Science",
    initials: "RN",
    avatarColor: "bg-sky-500",
  },
  {
    id: 2,
    quote:
      "The Reliability Score actually matters, so I picked a tutor with 92+ and they were prepared, punctual, and genuinely helpful.",
    name: "Sarah Chen",
    faculty: "Year 2, Business Analytics",
    initials: "SC",
    avatarColor: "bg-rose-500",
  },
  {
    id: 3,
    quote:
      "Tutoring for MA1521 used to be hit or miss. Now I can filter for tutors who specifically got A+ in that exact semester.",
    name: "Vikram Patel",
    faculty: "Year 2, Data Science & Analytics",
    initials: "VP",
    avatarColor: "bg-amber-500",
  },
];

export const popularModules = [
  "CS1010S",
  "CS1231S",
  "CS2030S",
  "CS2040S",
  "CS2100",
  "CS2103T",
  "MA1521",
  "MA1522",
  "ST2334",
  "IS1108",
  "GEA1000",
  "BT1101",
  "EC1301",
  "CS3230",
  "CS4231",
];
