import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import IntegrationsSection from "@/components/IntegrationsSection";
import FAQSection from "@/components/FAQSection";
import CTABannerSection from "@/components/CTABannerSection";
import TestimonialsSection from "@/components/TestimonialsSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-900 to-neutral-800 text-white">
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-12 pb-8">
        {/* Hero Section */}
        <HeroSection />
        {/* Features Section */}
        <FeaturesSection />
        {/* How It Works Section */}
        <HowItWorksSection />
        {/* Integrations Section */}
        {/* <IntegrationsSection /> !Soon! */}
        {/* FAQ Section */}
        <FAQSection />
        {/* CTA Banner Section */}
        <CTABannerSection />
        {/* Social Proof / Testimonials */}
        <TestimonialsSection />
      </main>
    </div>
  );
}
