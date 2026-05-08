import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import { users, asApiError } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, Wallet, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$/;

export default function SellerUpi() {
  const { user, reloadMe } = useAuth();
  const navigate = useNavigate();
  const [upi, setUpi] = useState(user?.seller_profile?.upi_id || "");
  const [submitting, setSubmitting] = useState(false);

  if (user && !user.seller_profile) {
    return <Navigate to="/onboarding/become-seller" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!upiRegex.test(upi.trim())) {
      toast.error("UPI ID format looks off — try yourname@bank");
      return;
    }
    setSubmitting(true);
    try {
      await users.setUpi(upi.trim());
      await reloadMe();
      toast.success("UPI submitted", { description: "Bank-side verification is queued." });
      navigate("/onboarding/status", { replace: true });
    } catch (err) {
      const e = asApiError(err);
      const map = {
        SELLER_PROFILE_REQUIRED: "Become a seller first to add a UPI.",
        INVALID_UPI_ID: "That UPI ID isn't valid. Format: yourname@bank",
        VALIDATION_ERROR: "Please check the UPI format and try again.",
      };
      toast.error(map[e.code] || e.message);
      if (e.code === "SELLER_PROFILE_REQUIRED") navigate("/onboarding/become-seller");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl" data-testid="seller-upi-page">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 mb-6"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>

        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Step 2 of 3 — Payout UPI
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Where should we send your earnings?
        </h1>
        <p className="mt-3 text-zinc-400">
          Add the UPI ID linked to the bank account where you want payouts. You can change it anytime.
        </p>

        <form onSubmit={submit} className="mt-8" data-testid="seller-upi-form">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">UPI ID</label>
          <Input
            value={upi}
            onChange={(e) => setUpi(e.target.value.trim().toLowerCase())}
            placeholder="yourname@okhdfcbank"
            autoComplete="off"
            spellCheck={false}
            className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100 font-mono h-11"
            data-testid="seller-upi-input"
          />
          <p className="mt-2 text-[11px] text-zinc-600 font-mono">
            Examples: aman@okhdfcbank · 9876543210@paytm · priya@axl
          </p>

          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3 items-start" data-testid="upi-disclosure">
            <ShieldAlert className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <span className="text-amber-300 font-semibold">Heads up:</span> we only check the format here.
              Actual bank-side verification happens after you submit and may take a moment. You'll see a clear
              status on the next page.
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="seller-upi-submit"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3 text-sm font-semibold transition-all"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit UPI"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest">How payouts work</span>
          </div>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li>1. Buyer pays into Slotu escrow (not your UPI directly).</li>
            <li>2. You deliver access via the encrypted vault.</li>
            <li>3. Buyer confirms within 24h, or auto-confirms after 24h.</li>
            <li>4. Slotu sends your payout to this UPI within 24 hours, minus our commission.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
