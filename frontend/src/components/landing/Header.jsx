import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Header() {
  return (
    <header
      data-testid="site-header"
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-zinc-950/70 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-emerald-950">
            <Shield className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-zinc-50">
            slotu
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-emerald-400/80 ml-1 px-1.5 py-0.5 border border-emerald-500/30 rounded">
            beta
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how-it-works" className="hover:text-zinc-50 transition-colors" data-testid="nav-how-it-works">How it works</a>
          <a href="#services" className="hover:text-zinc-50 transition-colors" data-testid="nav-services">Services</a>
          <a href="#sellers" className="hover:text-zinc-50 transition-colors" data-testid="nav-sellers">For sellers</a>
          <a href="#pricing" className="hover:text-zinc-50 transition-colors" data-testid="nav-pricing">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#waitlist"
            data-testid="header-cta-waitlist"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
          >
            Join waitlist
          </a>
          <a
            href="#waitlist"
            data-testid="header-cta-primary"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 text-sm font-semibold transition-colors"
          >
            Get early access
          </a>
        </div>
      </div>
    </header>
  );
}
