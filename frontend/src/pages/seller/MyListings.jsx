import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, Clock3, IndianRupee, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AppShell from "../../components/app/AppShell";
import { asApiError, listings } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function MyListings() {
  const { user } = useAuth();
  const sellerProfile = user?.seller_profile;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await listings.listMine();
        if (!cancelled) {
          setItems(res.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          const error = asApiError(err);
          toast.error(error.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (user && !sellerProfile) return <Navigate to="/onboarding/become-seller" replace />;
  if (sellerProfile && !sellerProfile.upi_id) return <Navigate to="/onboarding/upi" replace />;

  const updateListingStatus = async (listingId, nextStatus) => {
    setBusyId(listingId);
    try {
      const updated = await listings.update(listingId, { status: nextStatus });
      setItems((current) => current.map((item) => (item.id === listingId ? { ...item, ...updated } : item)));
      toast.success(nextStatus === "paused" ? "Listing paused" : "Listing updated");
    } catch (err) {
      const error = asApiError(err);
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async (listingId) => {
    setBusyId(listingId);
    try {
      await listings.remove(listingId);
      setItems((current) => current.filter((item) => item.id !== listingId));
      toast.success("Listing removed");
    } catch (err) {
      const error = asApiError(err);
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl" data-testid="seller-listings-page">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">
              Seller listings
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tighter">
              Manage your listings
            </h1>
            <p className="mt-3 text-zinc-400 max-w-2xl">
              Create draft listings now, update pricing and slots, and keep your catalogue ready before the marketplace fully opens.
            </p>
          </div>
          <Link
            to="/seller/listings/new"
            data-testid="create-listing-link"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create listing
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 flex items-center gap-3 text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your listings…
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8" data-testid="seller-listings-empty">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">
              <Clock3 className="h-3 w-3" />
              No listings yet
            </div>
            <h2 className="font-display text-2xl font-semibold text-zinc-100">
              Create your first draft
            </h2>
            <p className="mt-2 text-sm text-zinc-400 max-w-xl">
              Add the service, price, duration, and slot count now. You can keep it as a draft or activate it later from this same screen.
            </p>
            <Link
              to="/seller/listings/new"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-5 py-2.5 text-sm font-semibold"
            >
              Start a listing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
                data-testid={`seller-listing-card-${item.id}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
                      <span>{item.service_category}</span>
                      <span>•</span>
                      <span>{item.status}</span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-zinc-50">
                      {item.service_name}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                      {item.description || "No description yet."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-[300px]">
                    <Stat label="Price" value={`₹${(item.price_paise / 100).toFixed(0)}`} />
                    <Stat label="Duration" value={`${item.duration_days}d`} />
                    <Stat label="Slots" value={`${item.slots_available}/${item.slots_total}`} />
                    <Stat label="Revenue" value={`₹${((item.total_revenue_paise || 0) / 100).toFixed(0)}`} />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {item.status !== "paused" ? (
                    <button
                      type="button"
                      onClick={() => updateListingStatus(item.id, "paused")}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
                    >
                      {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Pause
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateListingStatus(item.id, "active")}
                      disabled={busyId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:border-emerald-400 disabled:opacity-60"
                    >
                      {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Activate
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteListing(item.id)}
                    disabled={busyId === item.id}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-200 hover:border-rose-400 disabled:opacity-60"
                  >
                    {busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Remove
                  </button>

                  <div className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                    {item.has_credentials ? "credentials ready" : "vault setup pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-100 inline-flex items-center gap-1">
        {label === "Revenue" ? <IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> : null}
        {label === "Revenue" ? value.replace("₹", "") : value}
      </div>
    </div>
  );
}
