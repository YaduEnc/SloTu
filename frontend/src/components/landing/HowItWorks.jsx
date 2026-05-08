import React from "react";
import { motion } from "framer-motion";
import { Search, CreditCard, KeyRound, CheckCircle2 } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Search,
    title: "Browse listings",
    desc: "Filter by service, price, duration. Compare verified seller ratings before you choose.",
    accent: "bg-zinc-900",
  },
  {
    n: "02",
    icon: CreditCard,
    title: "Pay into escrow",
    desc: "UPI or card. Your money is held safely by Slotu — not the seller — until access works.",
    accent: "bg-emerald-500/10 border-emerald-500/30",
  },
  {
    n: "03",
    icon: KeyRound,
    title: "Receive instantly",
    desc: "Credentials or family-plan invite delivered automatically the moment payment confirms.",
    accent: "bg-zinc-900",
  },
  {
    n: "04",
    icon: CheckCircle2,
    title: "Confirm & done",
    desc: "Tap confirm within 24 hrs. Funds release to seller minus our small fee. That's it.",
    accent: "bg-zinc-900",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-testid="how-it-works-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            How it works
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
            Four steps. Total protection.
          </h2>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
            No more sketchy DMs or losing money to strangers on Telegram.
            Slotu sits in the middle so neither side can scam the other.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative rounded-2xl border border-zinc-800 ${step.accent} p-6 lg:p-7 group hover:border-zinc-700 transition-colors`}
                data-testid={`step-card-${i + 1}`}
              >
                <div className="flex items-start justify-between mb-12">
                  <div className="h-11 w-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-emerald-400" strokeWidth={2} />
                  </div>
                  <span className="font-mono text-xs text-zinc-600 tracking-wider">
                    {step.n}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-zinc-50 tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>

                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-px w-6 bg-zinc-800" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
