import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Lock, Zap, BadgeCheck, Shield, Fingerprint, Scale } from "lucide-react";
import { SiNetflix, SiSpotify, SiCanva, SiNotion, SiYoutube } from "react-icons/si";

const FloatingCard = ({ children, className = "", delay = 0, parallaxX, parallaxY }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    style={{ x: parallaxX, y: parallaxY }}
    className={className}
  >
    {children}
  </motion.div>
);

// Rotating word in headline
const ROTATING = ["Netflix", "Spotify", "Canva", "Notion", "YouTube"];
function useRotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2000);
    return () => clearInterval(id);
  }, []);
  return ROTATING[i];
}

// Avatar stack
const avatars = [
  { initial: "A", color: "bg-emerald-500" },
  { initial: "P", color: "bg-rose-500" },
  { initial: "R", color: "bg-amber-500" },
  { initial: "S", color: "bg-sky-500" },
  { initial: "K", color: "bg-violet-500" },
];

export default function Hero() {
  const word = useRotatingWord();

  // Cursor parallax for right-side cards
  const containerRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const px1 = useTransform(sx, (v) => v * -12);
  const py1 = useTransform(sy, (v) => v * -12);
  const px2 = useTransform(sx, (v) => v * 18);
  const py2 = useTransform(sy, (v) => v * 14);
  const px3 = useTransform(sx, (v) => v * -8);
  const py3 = useTransform(sy, (v) => v * 18);

  const onMove = (e) => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <section
      data-testid="hero-section"
      className="relative pt-28 pb-16 lg:pt-40 lg:pb-28 overflow-hidden"
    >
      <div className="absolute inset-0 radial-fade pointer-events-none" />
      <div className="absolute inset-0 dotted-grid opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left: copy */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-7"
            data-testid="hero-badge"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-300 tracking-wide">
              India's first escrow-protected slot marketplace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-[88px] font-bold tracking-tighter leading-[0.95] text-zinc-50"
            data-testid="hero-headline"
          >
            Share{" "}
            <span className="relative inline-block">
              <motion.span
                key={word}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -28, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block text-emerald-400"
                data-testid="hero-rotating-word"
              >
                {word}
              </motion.span>
              <span className="text-emerald-400">.</span>
            </span>
            <br />
            <span className="text-zinc-500">Zero scams.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-7 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
            data-testid="hero-subheadline"
          >
            Buy and sell slots on 25+ services with full escrow protection. Money is held safe until you confirm access works.
          </motion.p>

          {/* Avatar stack + waitlist count */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-7 flex items-center gap-3"
            data-testid="hero-waitlist-proof"
          >
            <div className="flex -space-x-2">
              {avatars.map((a, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full ${a.color} border-2 border-zinc-950 flex items-center justify-center text-[11px] font-display font-bold text-zinc-950`}
                >
                  {a.initial}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-mono font-semibold text-zinc-300">
                +1k
              </div>
            </div>
            <div className="text-sm">
              <span className="font-semibold text-zinc-100 font-mono tabular-nums">1,247</span>
              <span className="text-zinc-400"> already on the waitlist</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <Link
              to="/login"
              data-testid="hero-cta-browse"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3.5 text-base font-semibold transition-all hover:translate-y-[-1px] animate-pulse-glow"
            >
              Browse slots
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/login"
              data-testid="hero-cta-sell"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-100 px-6 py-3.5 text-base font-semibold transition-all backdrop-blur-sm"
            >
              Sell a slot
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-400" /> Funds held in escrow</div>
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /> Instant credentials</div>
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> Verified sellers</div>
          </motion.div>
        </div>

        {/* Right: floating bento composition with cursor parallax */}
        <div
          ref={containerRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="lg:col-span-5 relative h-[420px] md:h-[500px] hidden md:block"
        >
          <FloatingCard
            delay={0.2}
            parallaxX={px1}
            parallaxY={py1}
            className="absolute top-0 right-0 w-64 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <SiNetflix className="text-red-500 text-xl" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">Netflix Premium</div>
                <div className="text-xs text-zinc-500">1 slot • 4K UHD</div>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">per month</div>
                <div className="font-display text-2xl font-bold text-zinc-50">₹179</div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                ★ 4.9
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            delay={0.35}
            parallaxX={px2}
            parallaxY={py2}
            className="absolute top-32 left-0 w-72 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <SiSpotify className="text-emerald-500 text-xl" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">Spotify Family</div>
                <div className="text-xs text-zinc-500">2 slots available</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center">
                <div className="text-[10px] text-zinc-500 font-mono">PRICE</div>
                <div className="text-xs font-semibold text-zinc-100 mt-0.5">₹49</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-center">
                <div className="text-[10px] text-zinc-500 font-mono">DAYS</div>
                <div className="text-xs font-semibold text-zinc-100 mt-0.5">30</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
                <div className="text-[10px] text-emerald-500/80 font-mono">SAVE</div>
                <div className="text-xs font-semibold text-emerald-400 mt-0.5">73%</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard
            delay={0.5}
            parallaxX={px3}
            parallaxY={py3}
            className="absolute bottom-12 right-4 w-56 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-zinc-900/80 backdrop-blur-xl p-5"
          >
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-wider">Escrow active</span>
            </div>
            <div className="font-display text-2xl font-bold text-zinc-50">₹179.00</div>
            <div className="text-xs text-zinc-500 mt-1">Held until confirmed</div>
            <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full w-2/3 bg-emerald-500"></div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-2 font-mono">step 2 of 3 — buyer confirming</div>
          </FloatingCard>

          <FloatingCard
            delay={0.65}
            className="absolute bottom-0 left-12 flex items-center gap-2"
          >
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <SiCanva className="text-cyan-400 text-2xl" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <SiNotion className="text-zinc-100 text-2xl" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <SiYoutube className="text-red-500 text-2xl" />
            </div>
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-mono font-bold">
              +22
            </div>
          </FloatingCard>
        </div>

        {/* Mobile preview cards (simplified) */}
        <div className="md:hidden -mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="flex items-center gap-2 mb-2">
                <SiNetflix className="text-red-500" />
                <span className="text-xs font-medium text-zinc-100">Netflix</span>
              </div>
              <div className="font-display text-xl font-bold text-zinc-50">₹179<span className="text-xs text-zinc-500">/mo</span></div>
              <div className="text-[10px] font-mono text-emerald-400 mt-1">★ 4.9 • 4K UHD</div>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-zinc-900/70 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Escrow</span>
              </div>
              <div className="font-display text-xl font-bold text-zinc-50">₹179.00</div>
              <div className="mt-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-2/3 bg-emerald-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.85 }}
        className="relative mt-16 lg:mt-24 max-w-7xl mx-auto px-6 lg:px-10"
      >
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900/30 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
          <div className="flex items-center gap-3 px-6 py-4">
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="text-zinc-500">Payments via</span>{" "}
              <span className="text-zinc-100 font-medium">Cashfree</span>
              <span className="text-zinc-600"> · RBI-licensed</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Fingerprint className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="text-zinc-500">Sellers KYC'd via</span>{" "}
              <span className="text-zinc-100 font-medium">Aadhaar OTP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4">
            <Scale className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="text-zinc-500">Protected under</span>{" "}
              <span className="text-zinc-100 font-medium">IT Act 2000 §79</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
