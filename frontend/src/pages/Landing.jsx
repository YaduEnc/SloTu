import React from "react";
import { Toaster } from "../components/ui/sonner";
import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import HowItWorks from "../components/landing/HowItWorks";
import ServicesGrid from "../components/landing/ServicesGrid";
import TrustEscrow from "../components/landing/TrustEscrow";
import SellersCalculator from "../components/landing/SellersCalculator";
import Pricing from "../components/landing/Pricing";
import Waitlist from "../components/landing/Waitlist";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 antialiased" data-testid="landing-page">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <ServicesGrid />
        <TrustEscrow />
        <SellersCalculator />
        <Pricing />
        <Waitlist />
      </main>
      <Footer />
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
