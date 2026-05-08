import React from "react";
import { Toaster } from "../components/ui/sonner";
import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import Stats from "../components/landing/Stats";
import HowItWorks from "../components/landing/HowItWorks";
import ServicesGrid from "../components/landing/ServicesGrid";
import Activity from "../components/landing/Activity";
import TrustEscrow from "../components/landing/TrustEscrow";
import Comparison from "../components/landing/Comparison";
import SellersCalculator from "../components/landing/SellersCalculator";
import Pricing from "../components/landing/Pricing";
import Faq from "../components/landing/Faq";
import Waitlist from "../components/landing/Waitlist";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased" data-testid="landing-page">
      <Header />
      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <ServicesGrid />
        <Activity />
        <TrustEscrow />
        <Comparison />
        <SellersCalculator />
        <Pricing />
        <Faq />
        <Waitlist />
      </main>
      <Footer />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
