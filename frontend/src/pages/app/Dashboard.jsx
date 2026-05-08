import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import {
  ArrowRight, Lock, Zap, BadgeCheck, Store, ShoppingBag,
  AlertCircle, CheckCircle2, Clock
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const sp = user?.seller_profile || null;

  // Determine onboarding stage banner
  const stage = useMemo(() => {
    if (!user) return null;
    if (!sp) return "no_seller";
    if (!sp.upi_id) return "no_upi";
    if (!sp.upi_verified) return "upi_pending";
    if (sp.kyc_status !== "approved") return "kyc_pending";
    return "ready";
  }, [user, sp]);

  return (
    <AppShell>
      <div data-testid="dashboard-page">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Dashboard
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Hi{user?.name ? `, ${user.name.split(" ")[0]}` : " there"} 👋
        </h1>
        <p className="mt-2 text-zinc-400">
          Slotu is in pre-launch mode — buying & selling open soon. Here's what you can do today.
        </p>

        {/* Onboarding banner */}
        {stage && stage !== "ready" && <OnboardingBanner stage={stage} sp={sp} />}

        {/* Quick actions grid */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          <ActionCard
            icon={ShoppingBag}
            title="Browse slots"
            desc="See verified listings the moment marketplace opens."
            cta="Coming soon"
            disabled
            testId="action-browse"
          />
          <ActionCard
            icon={Store}
            title={sp ? "Seller centre" : "Become a seller"}
            desc={
              sp
                ? "Manage your seller profile and onboarding."
                : "Earn from unused slots on family or team plans."
            }
            cta={sp ? "Open seller centre" : "Get started"}
            to={sp ? "/seller" : "/onboarding/become-seller"}
            testId="action-seller"
          />
          <ActionCard
            icon={BadgeCheck}
            title="Profile"
            desc="Update your name and email so we can reach you."
            cta="Edit profile"
            to="/profile"
            testId="action-profile"
          />
        </div>

        {/* My orders placeholder */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">
            <Clock className="h-3 w-3" />
            Coming soon
          </div>
          <h3 className="font-display text-xl font-semibold text-zinc-100">No orders yet</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
            Your active subscriptions, payments and dispute history will live here when the marketplace opens.
          </p>
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid sm:grid-cols-3 gap-3">
          <Tip icon={Lock} text="Funds held in escrow until you confirm." />
          <Tip icon={Zap} text="Credentials delivered automatically." />
          <Tip icon={BadgeCheck} text="Sellers verified with phone + Aadhaar OTP." />
        </div>
      </div>
    </AppShell>
  );
}

function OnboardingBanner({ stage, sp }) {
  const map = {
    no_seller: {
      Icon: Store,
      tone: "emerald",
      title: "Want to earn from unused slots?",
      desc: "Become a seller in 2 minutes — phone OTP, UPI, Aadhaar.",
      cta: "Become a seller",
      to: "/onboarding/become-seller",
    },
    no_upi: {
      Icon: AlertCircle,
      tone: "amber",
      title: "Add your payout UPI",
      desc: "We need a UPI ID to send your earnings to. Format: yourname@bank.",
      cta: "Add UPI",
      to: "/onboarding/upi",
    },
    upi_pending: {
      Icon: Clock,
      tone: "amber",
      title: "Payout UPI submitted",
      desc: `${sp?.upi_id} is saved. Bank-side verification is pending.`,
      cta: "View status",
      to: "/onboarding/status",
    },
    kyc_pending: {
      Icon: Clock,
      tone: "amber",
      title: "Complete Aadhaar verification",
      desc: "Final step before you can list slots.",
      cta: "Verify identity",
      to: "/onboarding/status",
    },
  };
  const cfg = map[stage];
  if (!cfg) return null;
  const Icon = cfg.Icon;
  const cls = cfg.tone === "amber"
    ? "border-amber-500/40 bg-amber-500/5"
    : "border-emerald-500/40 bg-emerald-500/[0.06]";
  const iconCls = cfg.tone === "amber" ? "text-amber-400" : "text-emerald-400";
  return (
    <div
      data-testid={`onboarding-banner-${stage}`}
      className={`mt-8 rounded-2xl border ${cls} p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6`}
    >
      <div className={`h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconCls}`} />
      </div>
      <div className="flex-1">
        <div className="font-display text-lg font-semibold text-zinc-50">{cfg.title}</div>
        <div className="text-sm text-zinc-400 mt-0.5">{cfg.desc}</div>
      </div>
      <Link
        to={cfg.to}
        data-testid={`onboarding-cta-${stage}`}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        {cfg.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, cta, to, disabled = false, testId }) {
  const inner = (
    <div className="h-full flex flex-col">
      <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-5 group-hover:border-emerald-500/40 transition-colors">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div className="font-display text-xl font-semibold text-zinc-50">{title}</div>
      <p className="mt-1.5 text-sm text-zinc-400 flex-1">{desc}</p>
      <div className={`mt-5 inline-flex items-center gap-1 text-sm font-medium ${disabled ? "text-zinc-600" : "text-emerald-400 group-hover:text-emerald-300"}`}>
        {cta}
        {!disabled && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
      </div>
    </div>
  );
  const cls = "group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-colors";
  if (disabled) {
    return <div data-testid={testId} className={`${cls} opacity-60 cursor-not-allowed`}>{inner}</div>;
  }
  return <Link data-testid={testId} to={to} className={cls}>{inner}</Link>;
}

function Tip({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30">
      <Icon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
      <span className="text-sm text-zinc-300">{text}</span>
    </div>
  );
}
