import React from "react";
import { Link } from "react-router-dom";
import { Shield, Linkedin } from "lucide-react";
import { SiX, SiInstagram } from "react-icons/si";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="relative border-t border-zinc-900 bg-zinc-950 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4" data-testid="footer-logo">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-emerald-950">
                <Shield className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-zinc-50">slotu</span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
              India's trusted escrow marketplace for sharing digital subscription slots safely.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href="#" data-testid="social-x" aria-label="X" className="h-9 w-9 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:border-zinc-600 transition-colors">
                <SiX className="text-sm" />
              </a>
              <a href="#" data-testid="social-instagram" aria-label="Instagram" className="h-9 w-9 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:border-zinc-600 transition-colors">
                <SiInstagram className="text-sm" />
              </a>
              <a href="#" data-testid="social-linkedin" aria-label="LinkedIn" className="h-9 w-9 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-50 hover:border-zinc-600 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Product</div>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/#how-it-works" className="text-zinc-300 hover:text-zinc-50 transition-colors">How it works</a></li>
              <li><a href="/#services" className="text-zinc-300 hover:text-zinc-50 transition-colors">Services</a></li>
              <li><a href="/#pricing" className="text-zinc-300 hover:text-zinc-50 transition-colors">Pricing</a></li>
              <li><a href="/#waitlist" className="text-zinc-300 hover:text-zinc-50 transition-colors">Waitlist</a></li>
              <li><a href="/#faq" className="text-zinc-300 hover:text-zinc-50 transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Company</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" data-testid="footer-about" className="text-zinc-300 hover:text-zinc-50 transition-colors">About</Link></li>
              <li><Link to="/contact" data-testid="footer-contact" className="text-zinc-300 hover:text-zinc-50 transition-colors">Contact</Link></li>
              <li><a href="mailto:press@slotu.in" className="text-zinc-300 hover:text-zinc-50 transition-colors">Press</a></li>
              <li><a href="mailto:partners@slotu.in" className="text-zinc-300 hover:text-zinc-50 transition-colors">Partnerships</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Legal</div>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/terms" data-testid="footer-terms" className="text-zinc-300 hover:text-zinc-50 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" data-testid="footer-privacy" className="text-zinc-300 hover:text-zinc-50 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" data-testid="footer-refund" className="text-zinc-300 hover:text-zinc-50 transition-colors">Refund Policy</Link></li>
              <li><Link to="/cookies" data-testid="footer-cookies" className="text-zinc-300 hover:text-zinc-50 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/grievance" data-testid="footer-grievance" className="text-zinc-300 hover:text-zinc-50 transition-colors">Grievance Officer</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © 2026 Slotu Technologies Pvt. Ltd. — Marketplace intermediary, IT Act 2000 §79.
          </p>
          <p className="text-xs text-zinc-600 font-mono">
            Made with care in Bengaluru.
          </p>
        </div>
      </div>

      <div className="pointer-events-none select-none flex justify-center">
        <div className="font-display text-[18vw] font-extrabold tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 to-zinc-950 -mb-[2vw]">
          slotu
        </div>
      </div>
    </footer>
  );
}
