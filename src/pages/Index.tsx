
import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
