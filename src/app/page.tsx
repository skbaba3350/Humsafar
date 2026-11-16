import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import StepsSection from '@/components/StepsSection';
import WelcomeSection from '@/components/WelcomeSection';
import PrivacySection from '@/components/PrivacySection';
import FaqSection from '@/components/FaqSection';
import CtaBanner from '@/components/CtaBanner';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />
      <HeroSection />
      <StepsSection />
      <WelcomeSection />
      <PrivacySection />
      <FaqSection />
      <CtaBanner />
      <Footer />
    </main>
  );
}
