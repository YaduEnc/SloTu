import React from "react";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, BadgeCheck, Scale, RefreshCw, Eye } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Funds held in escrow",
    desc: "Your payment sits in Slotu's neutral account until you confirm access. Sellers never get the money first.",
  },
  {
    icon: BadgeCheck,
    title: "Verified sellers only",
    desc: "Every seller completes account setup, payout UPI onboarding, and in-product status checks before they start building listings.",
  },
  {
    icon: RefreshCw,
    title: "24-hour auto-refund",
    desc: "If credentials don't work or seller goes silent, you get a full automatic refund. No fighting, no DMs.",
  },
  {
    icon: Eye,
    title: "Trust score on every seller",
    desc: "Transparent ratings from real verified buyers. Built from actual completed transactions, not fake reviews.",
  },
];

export default function TrustEscrow() {
  return (
    <section
      id="trust"
      data-testid="trust-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900 overflow-hidden"
    >
      <div className="absolute inset-0 radial-fade pointer-events-none opacity-50" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 items-start">
        {/* Left: visual */}
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            Trust & escrow
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
            Built so neither side
            <br />
            can scam the other.
          </h2>

          <div className="mt-10 relative rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden">
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
            <div className="relative p-8">
              <div className="flex items-center gap-2 text-emerald-400 mb-6">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-mono uppercase tracking-wider">Live escrow flow</span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Buyer pays", val: "₹179.00", state: "done" },
                  { label: "Slotu holds", val: "Escrow active", state: "done" },
                  { label: "Seller delivers", val: "Awaiting", state: "active" },
                  { label: "Buyer confirms", val: "Pending", state: "pending" },
                  { label: "Funds released", val: "—", state: "pending" },
                ].map((row, i) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${
                      row.state === "done" ? "bg-emerald-500" :
                      row.state === "active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"
                    }`} />
                    <div className="flex-1 flex items-center justify-between text-sm">
                      <span className={row.state === "pending" ? "text-zinc-600" : "text-zinc-200"}>
                        {row.label}
                      </span>
                      <span className={`font-mono text-xs ${
                        row.state === "done" ? "text-emerald-400" :
                        row.state === "active" ? "text-zinc-100" : "text-zinc-600"
                      }`}>
                        {row.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center gap-3 text-xs text-zinc-500">
                <Scale className="h-4 w-4 text-emerald-400/70 flex-shrink-0" />
                <span>Protected under IT Act 2000, Section 79 — Slotu acts as a neutral intermediary.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: features */}
        <div className="lg:col-span-7 space-y-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all p-6 lg:p-8"
                data-testid={`trust-feature-${i + 1}`}
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-emerald-500/40 transition-colors">
                    <Icon className="h-5 w-5 text-emerald-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-zinc-50 tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-zinc-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
