import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/landing/Header";
import Footer from "../components/landing/Footer";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50" data-testid="not-found-page">
      <Header />
      <main className="pt-32 pb-20 min-h-[80vh] flex items-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <div className="font-display text-[140px] md:text-[200px] font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-950">
            404
          </div>
          <div className="-mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5">
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300 tracking-wide">
              Lost in the marketplace
            </span>
          </div>
          <h1 className="mt-6 font-display text-4xl md:text-5xl font-bold tracking-tighter">
            This slot doesn't exist.
          </h1>
          <p className="mt-4 text-zinc-400 text-lg max-w-md mx-auto">
            The page you're looking for was either moved, removed, or never existed in the first place.
          </p>
          <Link
            to="/"
            data-testid="not-found-home"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3 text-base font-semibold transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Take me home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
