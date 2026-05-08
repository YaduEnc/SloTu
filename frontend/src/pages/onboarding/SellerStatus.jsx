import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import { users, asApiError } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { ArrowRight, CheckCircle2, Clock, Loader2, Pencil, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { key: "profile", label: "Seller profile created" },
  { key: "upi", label: "Payout UPI added" },
  { key: "status", label: "Onboarding ready" },
];

export default function SellerStatus() {
  const { user, reloadMe } = useAuth();
  const sp = user?.seller_profile;

  const stepStates = useMemo(
    () => ({
      profile: "done",
      upi: sp?.upi_id ? (sp.upi_verified ? "done" : "pending") : "todo",
      status: sp?.upi_id ? "done" : "todo",
    }),
    [sp],
  );

  if (user && !sp) return <Navigate to="/onboarding/become-seller" replace />;
  if (sp && !sp.upi_id) return <Navigate to="/onboarding/upi" replace />;

  return (
    <AppShell>
      <div className="max-w-3xl" data-testid="seller-status-page">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Seller centre
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Your seller setup
        </h1>
        <p className="mt-3 text-zinc-400">
          Your seller profile is active. Keep your payout UPI current and check status updates here before listings and payouts go live.
        </p>

        <div className="mt-10 space-y-3">
          {STEPS.map((step, index) => (
            <StepRow key={step.key} index={index} step={step} state={stepStates[step.key]} />
          ))}
        </div>

        <UpiPanel sp={sp} reloadMe={reloadMe} />

        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">Next step</div>
          <h2 className="font-display text-2xl font-semibold text-zinc-50">
            Start building your catalogue
          </h2>
          <p className="mt-2 text-sm text-zinc-300 max-w-2xl">
            Your seller account is ready for draft listings. Create your first listing now, then manage pricing, slots, and status from the seller listings page.
          </p>
          <Link
            to="/seller/listings"
            data-testid="seller-status-open-listings"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 text-sm font-semibold"
          >
            Open seller listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Trust score</span>
          </div>
          <div className="font-display text-4xl font-bold text-zinc-50 tabular-nums">
            {Number(sp?.trust_score ?? 0).toFixed(2)}
            <span className="text-zinc-500 text-xl font-mono"> / 5.00</span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Trust score grows with every clean transaction. New sellers start at 0 and build reputation as the marketplace opens up.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function StepRow({ index, step, state }) {
  const palette = {
    done: {
      ring: "border-emerald-500/40 bg-emerald-500/5",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      label: "Complete",
      labelCls: "text-emerald-400",
    },
    pending: {
      ring: "border-amber-500/40 bg-amber-500/5",
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      label: "Pending",
      labelCls: "text-amber-300",
    },
    todo: {
      ring: "border-zinc-800 bg-zinc-900/40",
      icon: <Clock className="h-4 w-4 text-zinc-500" />,
      label: "Not started",
      labelCls: "text-zinc-500",
    },
  }[state];

  return (
    <div
      data-testid={`status-step-${step.key}`}
      className={`rounded-2xl border ${palette.ring} px-5 py-4 flex items-center gap-4`}
    >
      <div className="h-9 w-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
        {palette.icon}
      </div>
      <div className="flex-1">
        <div className="font-display text-base font-semibold text-zinc-50">
          <span className="font-mono text-xs text-zinc-500 mr-2">0{index + 1}</span>
          {step.label}
        </div>
      </div>
      <span className={`text-[10px] font-mono uppercase tracking-widest ${palette.labelCls}`}>
        {palette.label}
      </span>
    </div>
  );
}

function UpiPanel({ sp, reloadMe }) {
  const [editing, setEditing] = useState(false);
  const [upi, setUpi] = useState(sp?.upi_id || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$/.test(upi.trim())) {
      toast.error("Format looks off — yourname@bank");
      return;
    }
    setBusy(true);
    try {
      await users.setUpi(upi.trim());
      await reloadMe();
      setEditing(false);
      toast.success("UPI updated");
    } catch (err) {
      const error = asApiError(err);
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6" data-testid="status-upi-panel">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-mono uppercase tracking-widest">Payout UPI</span>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            data-testid="upi-edit-btn"
            className="text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" /> Change
          </button>
        )}
      </div>

      {!editing ? (
        <div>
          <div className="font-mono text-lg text-zinc-100" data-testid="upi-display">
            {sp?.upi_id || "—"}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {sp?.upi_verified ? (
              <Badge tone="emerald" testId="upi-status-verified">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge tone="amber" testId="upi-status-pending">
                <Clock className="h-3 w-3" /> UPI submitted
              </Badge>
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            We&apos;ve saved this UPI ID. You can keep onboarding and we&apos;ll surface any payout review updates here before money moves.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <Input
            value={upi}
            onChange={(e) => setUpi(e.target.value.trim().toLowerCase())}
            className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100 font-mono"
            data-testid="upi-edit-input"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              data-testid="upi-edit-submit"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setUpi(sp?.upi_id || "");
              }}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Badge({ tone, children, testId }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${cls}`}
    >
      {children}
    </span>
  );
}
