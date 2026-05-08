import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import { users, asApiError } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../components/ui/input-otp";
import {
  CheckCircle2, Clock, ArrowRight, Loader2, ShieldCheck, Fingerprint, Wallet, Pencil
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { key: "profile", label: "Become a seller" },
  { key: "upi",     label: "Payout UPI" },
  { key: "kyc",     label: "Aadhaar verification" },
];

export default function SellerStatus() {
  const { user, reloadMe } = useAuth();
  const sp = user?.seller_profile;

  if (user && !sp) return <Navigate to="/onboarding/become-seller" replace />;
  if (sp && !sp.upi_id) return <Navigate to="/onboarding/upi" replace />;

  const stepStates = useMemo(() => ({
    profile: "done",
    upi: sp?.upi_id ? (sp.upi_verified ? "done" : "pending") : "todo",
    kyc:
      sp?.kyc_status === "approved" ? "done" :
      sp?.aadhaar_verified ? "done" :
      sp?.kyc_status === "submitted" ? "pending" : "todo",
  }), [sp]);

  return (
    <AppShell>
      <div className="max-w-3xl" data-testid="seller-status-page">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Seller centre — onboarding
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Your verification status
        </h1>
        <p className="mt-3 text-zinc-400">
          Slotu uses 3-step verification so buyers can trust who they're paying. Each step builds your trust score.
        </p>

        {/* Step list */}
        <div className="mt-10 space-y-3">
          {STEPS.map((s, i) => (
            <StepRow key={s.key} index={i} step={s} state={stepStates[s.key]} />
          ))}
        </div>

        {/* UPI panel */}
        <UpiPanel sp={sp} reloadMe={reloadMe} />

        {/* Aadhaar panel */}
        <AadhaarPanel sp={sp} reloadMe={reloadMe} />

        {/* Trust score */}
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
            Trust score grows with every clean transaction. New sellers start at 0 and climb fast.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function StepRow({ index, step, state }) {
  const palette = {
    done: { ring: "border-emerald-500/40 bg-emerald-500/5", icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, label: "Complete", labelCls: "text-emerald-400" },
    pending: { ring: "border-amber-500/40 bg-amber-500/5", icon: <Clock className="h-4 w-4 text-amber-400" />, label: "Pending", labelCls: "text-amber-300" },
    todo: { ring: "border-zinc-800 bg-zinc-900/40", icon: <Clock className="h-4 w-4 text-zinc-500" />, label: "Not started", labelCls: "text-zinc-500" },
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
      const e = asApiError(err);
      toast.error(e.message);
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
          <div className="font-mono text-lg text-zinc-100" data-testid="upi-display">{sp?.upi_id || "—"}</div>
          <div className="mt-2 flex items-center gap-2">
            {sp?.upi_verified ? (
              <Badge tone="emerald" testId="upi-status-verified">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge tone="amber" testId="upi-status-pending">
                <Clock className="h-3 w-3" /> UPI submitted · verification pending
              </Badge>
            )}
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
            We've saved this UPI ID. Bank-side verification happens before your first payout — you don't need to do anything now.
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
              onClick={() => { setEditing(false); setUpi(sp?.upi_id || ""); }}
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

function AadhaarPanel({ sp, reloadMe }) {
  const [stage, setStage] = useState("idle"); // idle | otp
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState(null);
  const [busy, setBusy] = useState(false);
  const verified = !!sp?.aadhaar_verified || sp?.kyc_status === "approved";

  const sendOtp = async (e) => {
    e?.preventDefault?.();
    if (!/^\d{12}$/.test(aadhaar)) {
      toast.error("Aadhaar must be 12 digits");
      return;
    }
    setBusy(true);
    try {
      const res = await users.aadhaarSendOtp(aadhaar);
      setReqId(res.kyc_request_id);
      setStage("otp");
      toast.success("OTP sent to your Aadhaar-linked mobile");
    } catch (err) {
      const e = asApiError(err);
      const map = {
        KYC_REQUEST_FORBIDDEN: "Verification is locked for now. Contact support.",
        VALIDATION_ERROR: "Aadhaar number doesn't look right",
      };
      toast.error(map[e.code] || e.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setBusy(true);
    try {
      await users.aadhaarVerifyOtp(reqId, otp);
      await reloadMe();
      toast.success("Identity verified");
      setStage("idle");
      setAadhaar(""); setOtp(""); setReqId(null);
    } catch (err) {
      const e = asApiError(err);
      const map = {
        KYC_OTP_INVALID: "Wrong OTP. Try again.",
        KYC_OTP_EXPIRED: "OTP expired. Resend a fresh one.",
      };
      toast.error(map[e.code] || e.message);
      if (e.code === "KYC_OTP_EXPIRED") { setStage("idle"); setOtp(""); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6" data-testid="status-aadhaar-panel">
      <div className="flex items-center gap-2 text-emerald-400 mb-3">
        <Fingerprint className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-widest">Aadhaar verification</span>
      </div>

      {verified ? (
        <Badge tone="emerald" testId="kyc-status-approved">
          <CheckCircle2 className="h-3 w-3" /> Identity verified
        </Badge>
      ) : stage === "idle" ? (
        <form onSubmit={sendOtp}>
          <p className="text-sm text-zinc-400 mb-3">
            We send an OTP to your Aadhaar-linked mobile via our KYC partner. Your Aadhaar number is never stored.
          </p>
          <Input
            inputMode="numeric"
            maxLength={12}
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="12-digit Aadhaar"
            className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100 font-mono"
            data-testid="aadhaar-input"
          />
          <button
            type="submit"
            disabled={busy}
            data-testid="aadhaar-send-otp"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-5 py-2.5 text-sm font-semibold transition-all"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {busy ? "Sending…" : "Send OTP"}
            {!busy && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </form>
      ) : (
        <div>
          <p className="text-sm text-zinc-400 mb-3">Enter the 6-digit OTP sent to your Aadhaar mobile.</p>
          <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="aadhaar-otp-input">
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="h-11 w-11 rounded-lg border border-zinc-800 bg-zinc-950 text-base font-mono text-zinc-100 first:rounded-l-lg last:rounded-r-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={verifyOtp}
              disabled={busy || otp.length !== 6}
              data-testid="aadhaar-verify-otp"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-5 py-2.5 text-sm font-semibold"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStage("idle"); setOtp(""); }}
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Change Aadhaar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ tone, children, testId }) {
  const cls = tone === "emerald"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return (
    <span data-testid={testId} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${cls}`}>
      {children}
    </span>
  );
}
