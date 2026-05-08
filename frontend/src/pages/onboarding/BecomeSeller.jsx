import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import { users, asApiError } from "../../lib/api";
import { Store, Lock, Zap, BadgeCheck, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function BecomeSeller() {
  const { user, reloadMe } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Already a seller — short-circuit
  if (user?.seller_profile) {
    return (
      <AppShell>
        <div className="max-w-2xl" data-testid="become-seller-already">
          <h1 className="font-display text-3xl font-bold tracking-tighter">You're already a seller</h1>
          <p className="mt-2 text-zinc-400">Continue your onboarding to start listing slots.</p>
          <Link
            to="/seller"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 text-sm font-semibold"
          >
            Open seller centre
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </AppShell>
    );
  }

  const become = async () => {
    setSubmitting(true);
    try {
      await users.becomeSeller();
      await reloadMe();
      toast.success("You're now a seller. Let's set up your payout UPI.");
      navigate("/onboarding/upi", { replace: true });
    } catch (err) {
      const e = asApiError(err);
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl" data-testid="become-seller-page">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 mb-6"
        >
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>

        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Become a seller
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tighter leading-[1.05]">
          Turn empty slots
          <br />
          <span className="text-zinc-500">into monthly income.</span>
        </h1>
        <p className="mt-5 text-zinc-400 max-w-xl">
          You'll add a payout UPI once, and we'll keep your seller profile ready for listing access.
          We hold every buyer's payment in escrow — you only get paid when access is confirmed.
        </p>

        <div className="mt-10 grid sm:grid-cols-3 gap-3">
          <Step n="01" Icon={Store} title="Become a seller" desc="One-tap. We create your seller profile." />
          <Step n="02" Icon={Lock} title="Add payout UPI" desc="Where we'll send your earnings." />
          <Step n="03" Icon={BadgeCheck} title="Review status" desc="See onboarding progress and update payout details anytime." />
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-zinc-900/40 p-6 md:p-8">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">What you'll earn</div>
          <ul className="space-y-2 text-sm text-zinc-200">
            <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-emerald-400 mt-0.5" /> 92–95% of every sale (we charge 5–8% commission, 4% on Pro)</li>
            <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-emerald-400 mt-0.5" /> Payouts to your UPI within 24 hours of buyer confirmation</li>
            <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-emerald-400 mt-0.5" /> A trust score that grows with every clean transaction</li>
          </ul>
        </div>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={become}
            disabled={submitting}
            data-testid="become-seller-btn"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3 text-sm font-semibold transition-all"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Setting up…" : "I want to sell — set me up"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
          <Link
            to="/dashboard"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            data-testid="become-seller-skip"
          >
            Maybe later
          </Link>
        </div>

        <p className="mt-6 text-xs text-zinc-600 max-w-xl">
          By becoming a seller you agree to Slotu's seller terms — only list services where family or team
          sharing is permitted by the underlying ToS, never share buyer credentials, and respond to disputes
          within 24 hours.
        </p>
      </div>
    </AppShell>
  );
}

function Step({ n, Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="font-mono text-xs text-zinc-600 tracking-wider">{n}</span>
      </div>
      <div className="font-display text-base font-semibold text-zinc-50">{title}</div>
      <div className="text-xs text-zinc-500 mt-1">{desc}</div>
    </div>
  );
}
