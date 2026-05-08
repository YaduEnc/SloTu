import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "./landing/Header";
import Footer from "./landing/Footer";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ title, subtitle, lastUpdated, children, testId }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50" data-testid={testId}>
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <Link
            to="/"
            data-testid="back-home"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 mb-10 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>

          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
            {subtitle}
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-6 text-sm text-zinc-500 font-mono">
              Last updated: {lastUpdated}
            </p>
          )}

          <article className="mt-12 prose-slotu space-y-8">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export const H2 = ({ children }) => (
  <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-zinc-50 mt-12 mb-4">
    {children}
  </h2>
);

export const H3 = ({ children }) => (
  <h3 className="font-display text-lg md:text-xl font-semibold tracking-tight text-zinc-100 mt-8 mb-3">
    {children}
  </h3>
);

export const P = ({ children }) => (
  <p className="text-zinc-300 leading-relaxed text-base">{children}</p>
);

export const UL = ({ children }) => (
  <ul className="list-disc pl-6 space-y-2 text-zinc-300 leading-relaxed marker:text-emerald-500">{children}</ul>
);

export const LI = ({ children }) => <li className="pl-1">{children}</li>;

export const Note = ({ children }) => (
  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-100">
    {children}
  </div>
);

export const Card = ({ title, children }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
    {title && <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">{title}</div>}
    {children}
  </div>
);
