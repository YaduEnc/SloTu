import React from "react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "../ui/accordion";

const faqs = [
  {
    q: "Is this even legal?",
    a: "Yes. Slotu only lists services where family or team sharing is officially permitted by their Terms of Service — Netflix Extra Member, Spotify Family, YouTube Premium Family, Microsoft 365 Family, Canva Pro Teams, etc. Slotu acts as a marketplace intermediary protected under Section 79 of India's IT Act 2000."
  },
  {
    q: "How does the escrow protection work?",
    a: "When you pay, the money goes into Slotu's neutral escrow account — not the seller's pocket. The seller is notified to add you to their plan or share access. You confirm access within 24 hours. Only then does the seller receive the payout. If access doesn't work, you get a full automatic refund."
  },
  {
    q: "What if the seller removes me from the plan after a few days?",
    a: "Open a dispute from your dashboard with proof. Our team reviews within 24 hours. Verified disputes result in a full or partial refund, and the seller's trust score takes a hit. Repeat offenders are banned permanently."
  },
  {
    q: "How fast do I get access after paying?",
    a: "Instant. The moment payment confirms via webhook, credentials or family-plan invite links unlock in your dashboard via a one-time OTP-gated reveal. No DMs, no waiting."
  },
  {
    q: "How is my payment information protected?",
    a: "All payments are processed by Cashfree, an RBI-licensed payment aggregator. We never store your card or UPI details. Account credentials in the seller vault are encrypted with AES-256-GCM and only revealed to verified buyers via a one-time OTP."
  },
  {
    q: "What does Slotu charge?",
    a: "Buyers pay zero platform fee — you only pay the slot price. Sellers pay 5–8% commission per successful sale. Slotu Pro sellers (₹199/mo) get a lower 4% rate plus boosted listings and analytics."
  },
  {
    q: "Can I sell my Netflix slot?",
    a: "If you have an empty seat on a paid family plan and the service ToS allows adding members, yes. Sign up with email OTP, finish seller setup, add your payout UPI, create a listing draft, and upload credentials to the encrypted vault when that flow opens. Funds reach your UPI after buyer confirmation."
  },
  {
    q: "When does Slotu launch?",
    a: "Soon. Join the waitlist to get founding-member perks: lower fees for life, 3 months of Pro free, and a verified badge from day one."
  },
];

export default function Faq() {
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
          FAQ
        </div>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
          Questions we get
          <br />
          <span className="text-zinc-500">a lot.</span>
        </h2>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="border border-zinc-800 rounded-2xl bg-zinc-900/40 px-5 lg:px-7 data-[state=open]:bg-zinc-900/70"
              data-testid={`faq-item-${i}`}
            >
              <AccordionTrigger className="font-display text-base md:text-lg text-zinc-100 hover:no-underline py-5 text-left">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 leading-relaxed pb-5 text-base">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="mt-10 text-sm text-zinc-500 text-center">
          Got another question? Email <a href="mailto:hello@slotu.in" className="text-emerald-400 hover:underline">hello@slotu.in</a>
        </p>
      </div>
    </section>
  );
}
