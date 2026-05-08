import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import AppShell from "../../components/app/AppShell";
import { asApiError, listings } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Input } from "../../components/ui/input";

export default function NewListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sellerProfile = user?.seller_profile;
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serviceSlug, setServiceSlug] = useState("");
  const [priceRupees, setPriceRupees] = useState("179");
  const [durationDays, setDurationDays] = useState("30");
  const [slotsTotal, setSlotsTotal] = useState("1");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const items = await listings.catalog();
        if (!cancelled) {
          setCatalog(items || []);
          setServiceSlug(items?.[0]?.slug || "");
        }
      } catch (err) {
        if (!cancelled) {
          const error = asApiError(err);
          toast.error(error.message);
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    };
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedService = useMemo(
    () => catalog.find((item) => item.slug === serviceSlug) || null,
    [catalog, serviceSlug],
  );

  if (user && !sellerProfile) return <Navigate to="/onboarding/become-seller" replace />;
  if (sellerProfile && !sellerProfile.upi_id) return <Navigate to="/onboarding/upi" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const price_paise = Math.round(Number(priceRupees || 0) * 100);
    const duration_days = Number(durationDays || 0);
    const slots_total = Number(slotsTotal || 0);

    if (!serviceSlug) {
      toast.error("Choose a service");
      return;
    }
    if (!Number.isFinite(price_paise) || price_paise < 1900 || price_paise > 199900) {
      toast.error("Price must be between ₹19 and ₹1999");
      return;
    }
    if (!Number.isFinite(duration_days) || duration_days < 1 || duration_days > 365) {
      toast.error("Duration must be between 1 and 365 days");
      return;
    }
    if (!Number.isFinite(slots_total) || slots_total < 1 || slots_total > 10) {
      toast.error("Slots must be between 1 and 10");
      return;
    }

    setSubmitting(true);
    try {
      await listings.create({
        service_slug: serviceSlug,
        price_paise,
        duration_days,
        slots_total,
        description: description.trim() || undefined,
      });
      toast.success("Draft listing created");
      navigate("/seller/listings", { replace: true });
    } catch (err) {
      const error = asApiError(err);
      const map = {
        INVALID_SERVICE: "This service is not allowed in the catalog",
        SELLER_ONBOARDING_INCOMPLETE: "Add your payout UPI before creating listings",
      };
      toast.error(map[error.code] || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl" data-testid="seller-new-listing-page">
        <Link
          to="/seller/listings"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-emerald-400 mb-6"
        >
          <ArrowLeft className="h-3 w-3" /> Back to listings
        </Link>

        <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
          New listing
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
          Create a listing draft
        </h1>
        <p className="mt-3 text-zinc-400 max-w-2xl">
          Pick a supported service, set your price and slot count, and save it as a draft. You can pause, activate, or remove it later from your seller listings page.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-6">
          <Field label="Service">
            {loadingCatalog ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400 inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading service catalog…
              </div>
            ) : (
              <select
                value={serviceSlug}
                onChange={(e) => setServiceSlug(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 focus:border-emerald-500 outline-none"
                data-testid="listing-service-select"
              >
                {catalog.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name} · {item.category}
                  </option>
                ))}
              </select>
            )}
            {selectedService ? (
              <p className="mt-2 text-xs text-zinc-500">
                Only services in Slotu&apos;s allow-list can be listed. Current category: {selectedService.category}.
              </p>
            ) : null}
          </Field>

          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Price (₹)">
              <Input
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value.replace(/[^\d.]/g, ""))}
                className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100"
                data-testid="listing-price-input"
              />
            </Field>
            <Field label="Duration (days)">
              <Input
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value.replace(/\D/g, ""))}
                className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100"
                data-testid="listing-duration-input"
              />
            </Field>
            <Field label="Slots">
              <Input
                value={slotsTotal}
                onChange={(e) => setSlotsTotal(e.target.value.replace(/\D/g, ""))}
                className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 text-zinc-100"
                data-testid="listing-slots-input"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What should the buyer know? Region, plan type, delivery expectations, renewal date, and any practical guardrails."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 outline-none"
              data-testid="listing-description-input"
            />
          </Field>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Store className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-widest">Draft behaviour</span>
            </div>
            <p className="text-sm text-zinc-400">
              New listings are created as drafts in the current v1 flow. You can still manage price, slots, and status from your listings dashboard while the credential vault and live order flow are being completed.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || loadingCatalog}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-emerald-950 px-6 py-3 text-sm font-semibold"
            data-testid="listing-create-submit"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating…" : "Create draft listing"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </AppShell>
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
