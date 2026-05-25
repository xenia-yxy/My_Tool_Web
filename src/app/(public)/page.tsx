import { AiPracticeAssistant } from "@/components/assistant/ai-practice-assistant";
import { AmbientField } from "@/components/home/ambient-field";
import { ContactSection } from "@/components/home/contact-section";
import { EntranceGrid } from "@/components/home/entrance-grid";
import { FeaturedSection } from "@/components/home/featured-section";
import { HeroSection } from "@/components/home/hero-section";
import { SiteHeader } from "@/components/home/site-header";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AmbientField />
      <div className="relative z-10">
        <SiteHeader />
        <HeroSection />
        <EntranceGrid />
        <FeaturedSection />
        <ContactSection />
        <AiPracticeAssistant />
      </div>
    </main>
  );
}

