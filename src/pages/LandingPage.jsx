import React, { useEffect } from 'react';
import Lenis from 'lenis';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import TrustedBy from '../components/landing/TrustedBy';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import LiveDashboard from '../components/landing/LiveDashboard';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import Background from '../components/landing/Background';

export default function LandingPage() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-[#0B0F1C] text-slate-100 min-h-screen font-sans selection:bg-indigo-500/30 selection:text-white">
      <Background />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <TrustedBy />
        <Features />
        <HowItWorks />
        <LiveDashboard />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
