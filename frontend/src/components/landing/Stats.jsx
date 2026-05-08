import React, { useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 1500, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setVal(Math.round(eased * target));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return val;
}

export default function Stats() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const saved = useCountUp(2840000, 1800, inView);    // 28.4 lakh saved
  const sellers = useCountUp(1247, 1500, inView);
  const services = useCountUp(28, 1200, inView);

  return (
    <section
      ref={ref}
      data-testid="stats-section"
      className="relative py-16 lg:py-20 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-900">
          <Cell
            label="Pre-launch waitlist"
            value={`${sellers.toLocaleString("en-IN")}`}
            sub="signed up & counting"
            highlight
          />
          <Cell
            label="Already projected savings"
            value={`₹${(saved / 100000).toFixed(1)}L`}
            sub="vs solo subscriptions"
          />
          <Cell
            label="Services supported"
            value={services}
            sub="across 7 categories"
          />
          <Cell
            label="Auto-refund window"
            value="24h"
            sub="if access fails"
          />
        </div>
      </div>
    </section>
  );
}

function Cell({ label, value, sub, highlight = false }) {
  return (
    <div className={`p-6 lg:p-8 ${highlight ? "bg-zinc-900" : "bg-zinc-950"}`}>
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500 mb-3">{label}</div>
      <div className={`font-display text-4xl md:text-5xl font-bold tracking-tighter tabular-nums ${highlight ? "text-emerald-400" : "text-zinc-50"}`}>
        {value}
      </div>
      <div className="text-xs text-zinc-500 mt-2">{sub}</div>
    </div>
  );
}
