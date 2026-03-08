import BentoGrid from '@/components/BentoGrid';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import SocialProof from '@/components/SocialProof';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-main text-text-primary">
      <Navbar />
      <Hero />
      <BentoGrid />
      <SocialProof />
      <Footer />
    </main>
  );
}
