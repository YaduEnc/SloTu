import React, { useState } from "react";
import AppShell from "../../components/app/AppShell";
import { useAuth } from "../../lib/auth";
import { users, asApiError } from "../../lib/api";
import { Input } from "../../components/ui/input";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Email doesn't look right");
      return;
    }
    setSaving(true);
    try {
      const updated = await users.updateMe({
        name: name || null,
        email: email || null,
      });
      setUser((prev) => ({ ...prev, ...updated }));
      setSavedAt(Date.now());
      toast.success("Profile updated");
    } catch (err) {
      const e = asApiError(err);
      const map = {
        EMAIL_TAKEN: "That email is already linked to another account",
        VALIDATION_ERROR: "Please check the fields and try again",
      };
      toast.error(map[e.code] || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl" data-testid="profile-page">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          Profile
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Your details
        </h1>
        <p className="mt-2 text-zinc-400 text-sm">
          We use your email for receipts and dispute updates. Phone is locked to your verified number.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-6">
          <Field label="Phone (verified)" testId="profile-field-phone">
            <Input
              value={user?.phone || ""}
              disabled
              className="bg-zinc-900 border-zinc-800 text-zinc-400 font-mono cursor-not-allowed"
              data-testid="profile-phone-input"
            />
            <Hint>Phone is locked. Contact support to change it.</Hint>
          </Field>

          <Field label="Name" testId="profile-field-name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={120}
              className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100"
              data-testid="profile-name-input"
            />
          </Field>

          <Field label="Email" testId="profile-field-email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={160}
              className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100"
              data-testid="profile-email-input"
            />
          </Field>

          <Field label="Role" testId="profile-field-role">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800 bg-zinc-900 text-sm">
              <span className="font-mono uppercase text-[10px] tracking-widest text-emerald-400">{user?.role}</span>
            </div>
          </Field>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              data-testid="profile-save-btn"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3 text-sm font-semibold transition-all"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </button>
            {savedAt > 0 && !saving && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono" data-testid="profile-save-confirm">
                <Check className="h-3.5 w-3.5" /> saved
              </span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, testId, children }) {
  return (
    <div data-testid={testId}>
      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">{label}</label>
      {children}
    </div>
  );
}

function Hint({ children }) {
  return <p className="mt-1.5 text-[11px] text-zinc-600 font-mono">{children}</p>;
}
