import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import FeaturesGrid from "./components/FeaturesGrid";
import TutorShowcase from "./components/TutorShowcase";
import ForTutors from "./components/ForTutors";
import StatsSection from "./components/StatsSection";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturesGrid />
        <TutorShowcase />
        <ForTutors />
        <StatsSection />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
