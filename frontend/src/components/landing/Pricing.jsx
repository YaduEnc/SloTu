import React from "react";
import { Check, Sparkles } from "lucide-react";

const standard = [
  "5–8% commission per sale",
  "Unlimited listings",
  "Escrow protection",
  "Standard seller verification",
  "Email support",
];

const pro = [
  "Lower 4% commission",
  "Boosted listings & priority placement",
  "Advanced analytics dashboard",
  "Early access to new services",
  "Priority support over WhatsApp",
  "Bulk seller tools",
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      data-testid="pricing-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            Pricing
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
            Honest pricing.
            <br />
            <span className="text-zinc-500">No hidden fees, ever.</span>
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Buyers pay zero platform fee. Sellers pay only when they earn.
            Upgrade only if you want more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Standard */}
          <div
            data-testid="pricing-standard"
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 lg:p-10"
          >
            <div className="flex items-center gap-2 text-zinc-400 mb-6">
              <span className="text-xs font-mono uppercase tracking-widest">Standard</span>
              <span className="text-xs text-zinc-600">— for casual sellers</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-6xl font-bold tracking-tighter text-zinc-50">5–8%</span>
              <span className="text-zinc-500 text-lg">commission</span>
            </div>
            <p className="mt-3 text-sm text-zinc-500">Only when you sell. No upfront cost. No subscription.</p>

            <ul className="mt-8 space-y-3">
              {standard.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="#waitlist"
              data-testid="pricing-cta-standard"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-100 px-6 py-3 text-sm font-semibold transition-colors"
            >
              Start free
            </a>
          </div>

          {/* Pro */}
          <div
            data-testid="pricing-pro"
            className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.08] via-zinc-900/40 to-zinc-900/40 p-8 lg:p-10 overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-xs font-mono uppercase tracking-widest">Slotu Pro</span>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                  popular
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold tracking-tighter text-zinc-50">₹199</span>
                <span className="text-zinc-500 text-lg">/ month</span>
              </div>
              <p className="mt-3 text-sm text-zinc-400">For sellers running 3+ listings or treating this as side income.</p>

              <ul className="mt-8 space-y-3">
                {pro.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#waitlist"
                data-testid="pricing-cta-pro"
                className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3 text-sm font-semibold transition-colors"
              >
                Get Pro early access
              </a>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-zinc-600 max-w-2xl">
          Note: Slotu only lists services where family or team sharing is permitted under their official terms of service.
          Slotu is a marketplace intermediary protected under IT Act 2000, Section 79.
        </p>
      </div>
    </section>
  );
}
