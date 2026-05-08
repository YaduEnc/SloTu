import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Menu, X } from "lucide-react";

const navItems = [
  { id: "how-it-works", label: "How it works" },
  { id: "services", label: "Services" },
  { id: "sellers", label: "For sellers" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const onLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      if (!onLanding) return;
      // scroll spy
      const y = window.scrollY + 120;
      let cur = "";
      for (const n of navItems) {
        const el = document.getElementById(n.id);
        if (el && el.offsetTop <= y) cur = n.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onLanding]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const headerCls = scrolled || !onLanding
    ? "backdrop-blur-xl bg-zinc-950/85 border-b border-white/[0.06]"
    : "bg-transparent border-b border-transparent";

  const goSection = (id) => (e) => {
    if (!onLanding) return; // let Link handle it via /#id later
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 70, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <header
        data-testid="site-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerCls}`}
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

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {navItems.map((n) => (
              <a
                key={n.id}
                href={onLanding ? `#${n.id}` : `/#${n.id}`}
                onClick={onLanding ? goSection(n.id) : undefined}
                data-testid={`nav-${n.id}`}
                className={`relative px-3 py-2 transition-colors ${
                  active === n.id && onLanding
                    ? "text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {n.label}
                {active === n.id && onLanding && (
                  <span className="absolute left-3 right-3 -bottom-0.5 h-px bg-emerald-400" />
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={onLanding ? "#waitlist" : "/#waitlist"}
              onClick={onLanding ? goSection("waitlist") : undefined}
              data-testid="header-cta-waitlist"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-50 transition-colors"
            >
              Join waitlist
            </a>
            <a
              href={onLanding ? "#waitlist" : "/#waitlist"}
              onClick={onLanding ? goSection("waitlist") : undefined}
              data-testid="header-cta-primary"
              className="hidden md:inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 text-sm font-semibold transition-colors"
            >
              Get early access
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-zinc-800 text-zinc-200 hover:bg-zinc-900"
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        data-testid="mobile-menu"
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl" onClick={() => setMenuOpen(false)} />
        <div className="relative pt-24 px-6 max-w-md mx-auto">
          <nav className="flex flex-col gap-1">
            {navItems.map((n) => (
              <a
                key={n.id}
                href={onLanding ? `#${n.id}` : `/#${n.id}`}
                onClick={onLanding ? goSection(n.id) : () => setMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-zinc-200 hover:bg-zinc-900 text-lg font-medium border border-zinc-900"
                data-testid={`mobile-nav-${n.id}`}
              >
                {n.label}
              </a>
            ))}
            <a
              href={onLanding ? "#waitlist" : "/#waitlist"}
              onClick={onLanding ? goSection("waitlist") : () => setMenuOpen(false)}
              className="mt-4 px-4 py-3 rounded-full text-center bg-emerald-500 text-emerald-950 font-semibold"
              data-testid="mobile-cta"
            >
              Get early access
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
