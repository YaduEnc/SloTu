import React, { useState, useMemo } from "react";
import { Slider } from "../ui/slider";
import { TrendingUp, Wallet, ArrowUpRight } from "lucide-react";

export default function SellersCalculator() {
  const [slots, setSlots] = useState([3]);
  const [price, setPrice] = useState([149]);
  const [days, setDays] = useState([30]);

  const monthly = useMemo(() => slots[0] * price[0], [slots, price]);
  const fee = Math.round(monthly * 0.06);
  const payout = monthly - fee;
  const yearly = payout * 12;

  return (
    <section
      id="sellers"
      data-testid="sellers-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: copy */}
          <div className="lg:col-span-5">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
              For sellers
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
              Turn unused slots
              <br />
              into <span className="text-emerald-400">monthly income.</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
              Your Netflix family plan has empty seats. Your Spotify duo too.
              Every empty slot is money you're leaving on the table.
              Slotu makes it safe, automated, and instant.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Avg seller</div>
                <div className="font-display text-2xl font-bold text-zinc-50 mt-1">₹2,400/mo</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Payout time</div>
                <div className="font-display text-2xl font-bold text-zinc-50 mt-1">&lt; 24 hrs</div>
              </div>
            </div>

            <a
              href="#waitlist"
              data-testid="sellers-cta"
              className="mt-8 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold group"
            >
              Start selling
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {/* Right: calculator */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-10 overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Earnings calculator</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="font-mono">live</span>
                  </div>
                </div>

                {/* Big number */}
                <div className="mb-10">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono mb-2">Your monthly payout</div>
                  <div className="font-display text-6xl md:text-7xl font-bold tracking-tighter text-zinc-50 tabular-nums" data-testid="calculator-payout">
                    ₹{payout.toLocaleString('en-IN')}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="text-zinc-500">Gross: <span className="font-mono text-zinc-300">₹{monthly.toLocaleString('en-IN')}</span></span>
                    <span className="text-zinc-500">Fee (6%): <span className="font-mono text-zinc-300">₹{fee.toLocaleString('en-IN')}</span></span>
                    <span className="text-emerald-400">Yearly: <span className="font-mono">₹{yearly.toLocaleString('en-IN')}</span></span>
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-6">
                  {/* Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm text-zinc-300 font-medium">Slots you have</label>
                      <span className="font-mono text-sm text-emerald-400 tabular-nums" data-testid="calculator-slots-value">
                        {slots[0]}
                      </span>
                    </div>
                    <Slider
                      value={slots}
                      onValueChange={setSlots}
                      min={1}
                      max={10}
                      step={1}
                      data-testid="calculator-slider-slots"
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600 font-mono">
                      <span>1</span><span>10</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm text-zinc-300 font-medium">Price per slot / month</label>
                      <span className="font-mono text-sm text-emerald-400 tabular-nums" data-testid="calculator-price-value">
                        ₹{price[0]}
                      </span>
                    </div>
                    <Slider
                      value={price}
                      onValueChange={setPrice}
                      min={49}
                      max={499}
                      step={10}
                      data-testid="calculator-slider-price"
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600 font-mono">
                      <span>₹49</span><span>₹499</span>
                    </div>
                  </div>

                  {/* Days */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm text-zinc-300 font-medium">Subscription duration</label>
                      <span className="font-mono text-sm text-emerald-400 tabular-nums" data-testid="calculator-days-value">
                        {days[0]} days
                      </span>
                    </div>
                    <Slider
                      value={days}
                      onValueChange={setDays}
                      min={30}
                      max={365}
                      step={30}
                      data-testid="calculator-slider-days"
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600 font-mono">
                      <span>30 days</span><span>1 year</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
