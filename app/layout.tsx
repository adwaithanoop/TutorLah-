import type { Metadata, Viewport } from "next";
import { Outfit, Newsreader, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

// google fonts
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// page metadata
export const metadata: Metadata = {
  title: "TutorLah: Peer Tutoring Built for Your NUS Syllabus",
  description:
    "Find verified NUS peer tutors for any module. Ranked by a 5-Factor Reliability Score, available on demand with SOS bidding, and structured for real academic progress.",
  keywords: [
    "NUS tutoring",
    "peer tutor",
    "NUS modules",
    "CS2040S tutor",
    "academic support Singapore",
    "student tutor NUS",
  ],
  openGraph: {
    title: "TutorLah: Peer Tutoring Built for Your NUS Syllabus",
    description:
      "Verified tutors for every NUS module. Ranked by reliability, available when you need them.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TutorLah: peer tutoring that actually knows your syllabus",
    description: "Verified NUS tutors, ranked by reliability.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "TutorLah", statusBarStyle: "default" },
};

// browser ui theme colour
export const viewport: Viewport = {
  themeColor: "#2b5747",
};

// root shell that wraps every page
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${newsreader.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* registers the service worker so the app is installable */}
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
