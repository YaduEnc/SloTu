import React from "react";
import { Check, X, MessageCircleOff, ShieldCheck } from "lucide-react";

const rows = [
  { feature: "Money held safe until access works", slotu: true, telegram: false },
  { feature: "Verified seller (KYC + Aadhaar)", slotu: true, telegram: false },
  { feature: "Refund if seller disappears", slotu: true, telegram: false },
  { feature: "Public ratings & trust score", slotu: true, telegram: false },
  { feature: "Standardised pricing", slotu: true, telegram: false },
  { feature: "Auto-credentials delivery", slotu: true, telegram: false },
  { feature: "Grievance officer (legal recourse)", slotu: true, telegram: false },
  { feature: "Anonymous random stranger", slotu: false, telegram: true },
  { feature: "Lose money with no recourse", slotu: false, telegram: true },
];

export default function Comparison() {
  return (
    <section
      data-testid="comparison-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            Why not just use Telegram?
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
            One has escrow.
            <br />
            <span className="text-zinc-500">The other has prayers.</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_120px_120px] md:grid-cols-[1.5fr_1fr_1fr] border-b border-zinc-800">
            <div className="p-4 lg:p-6 text-xs font-mono uppercase tracking-widest text-zinc-500">
              What you get
            </div>
            <div className="p-4 lg:p-6 flex items-center justify-center gap-2 border-l border-zinc-800 bg-emerald-500/5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-display font-bold text-zinc-50">slotu</span>
            </div>
            <div className="p-4 lg:p-6 flex items-center justify-center gap-2 border-l border-zinc-800">
              <MessageCircleOff className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400 text-sm">Telegram / DMs</span>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-[1fr_120px_120px] md:grid-cols-[1.5fr_1fr_1fr] ${
                i < rows.length - 1 ? "border-b border-zinc-900" : ""
              }`}
            >
              <div className="p-4 lg:p-5 text-sm text-zinc-300">{row.feature}</div>
              <div className={`p-4 lg:p-5 flex items-center justify-center border-l border-zinc-900 ${row.slotu ? "bg-emerald-500/[0.03]" : ""}`}>
                {row.slotu ? (
                  <span className="h-7 w-7 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-zinc-600" strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="p-4 lg:p-5 flex items-center justify-center border-l border-zinc-900">
                {row.telegram ? (
                  <span className="h-7 w-7 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-red-400" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <X className="h-3.5 w-3.5 text-zinc-600" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
