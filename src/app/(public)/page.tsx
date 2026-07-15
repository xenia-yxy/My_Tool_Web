import { AmbientField } from "@/components/home/ambient-field";
import { HeroSection } from "@/components/home/hero-section";
import { SiteHeader } from "@/components/home/site-header";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <AmbientField />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <HeroSection />
      </div>
    </main>
  );
}

