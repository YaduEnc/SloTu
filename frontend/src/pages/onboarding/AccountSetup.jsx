import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Mail, Shield, ShoppingBag, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { asApiError, users } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function AccountSetup() {
  const { user, setUser, reloadMe } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [intent, setIntent] = useState(user?.seller_profile ? "seller" : "buyer");
  const [saving, setSaving] = useState(false);

  const email = useMemo(() => user?.email || "", [user?.email]);

  const continueFlow = async (selectedIntent) => {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      toast.error("Enter your full name");
      return;
    }

    setSaving(true);
    try {
      const updated = await users.updateMe({ name: cleanName, email: email || null });
      setUser((prev) => ({ ...prev, ...updated }));

      if (selectedIntent === "seller") {
        if (!user?.seller_profile) {
          await users.becomeSeller();
        }
        await reloadMe();
        toast.success("Account setup complete", { description: "Next up: add your payout UPI." });
        navigate("/onboarding/upi", { replace: true });
        return;
      }

      toast.success("Profile saved");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const error = asApiError(err);
      const map = {
        EMAIL_TAKEN: "That email is already linked to another account",
        VALIDATION_ERROR: "Please check your details and try again",
      };
      toast.error(map[error.code] || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 radial-fade pointer-events-none" />
      <div className="absolute inset-0 dotted-grid opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />

      <div className="relative w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-emerald-950">
            <Shield className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-zinc-50">slotu</span>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-7 md:p-9" data-testid="account-setup-page">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
            Final step
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
            Tell us a bit about you
          </h1>
          <p className="mt-3 text-zinc-400 text-sm max-w-xl">
            We already verified your email. Add your name, then choose whether you want to start as a buyer or go straight into seller setup.
          </p>

          <div className="mt-8 space-y-6">
            <Field label="Full name">
              <div className="relative">
                <UserRound className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={120}
                  className="pl-10 bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 h-11 text-zinc-100"
                  data-testid="account-setup-name-input"
                />
              </div>
            </Field>

            <Field label="Login email">
              <div className="relative">
                <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={email}
                  disabled
                  className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-400 h-11"
                  data-testid="account-setup-email-input"
                />
              </div>
            </Field>

            <div>
              <div className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">What do you want to do first?</div>
              <div className="grid md:grid-cols-2 gap-3">
                <IntentCard
                  active={intent === "buyer"}
                  title="Just explore as a buyer"
                  desc="Finish setup, enter the dashboard, and browse when the marketplace opens."
                  icon={ShoppingBag}
                  testId="intent-buyer"
                  onClick={() => setIntent("buyer")}
                />
                <IntentCard
                  active={intent === "seller"}
                  title="I want to sell slots"
                  desc="Create your seller profile now and continue straight into payout setup."
                  icon={Store}
                  testId="intent-seller"
                  onClick={() => setIntent("seller")}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => continueFlow(intent)}
              disabled={saving}
              data-testid="account-setup-continue"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3.5 text-sm font-semibold transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : intent === "seller" ? "Continue to seller setup" : "Continue to dashboard"}
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">{label}</label>
      {children}
    </div>
  );
}

function IntentCard({ active, title, desc, icon: Icon, onClick, testId }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`text-left rounded-2xl border p-5 transition-colors ${
        active
          ? "border-emerald-500/40 bg-emerald-500/8"
          : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700"
      }`}
    >
      <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="font-display text-lg font-semibold text-zinc-50">{title}</div>
      <p className="mt-1.5 text-sm text-zinc-400">{desc}</p>
    </button>
  );
}
