import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth, tokenStore, setUnauthorizedHandler } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const reloadMe = useCallback(async () => {
    try {
      const me = await auth.me();
      setUser(me);
      return me;
    } catch (e) {
      setUser(null);
      return null;
    }
  }, []);

  // Bootstrap: try refresh on mount; if access token retrieved, fetch me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await auth.refresh();
      if (cancelled) return;
      if (t) await reloadMe();
      setBootstrapped(true);
    })();
    return () => { cancelled = true; };
  }, [reloadMe]);

  // Wire 401 -> logout state
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  const completeLogin = useCallback((accessToken, userPayload) => {
    tokenStore.set(accessToken);
    setUser(userPayload);
  }, []);

  const logout = useCallback(async () => {
    try { await auth.logout(); } catch {}
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = {
    user,
    setUser,
    bootstrapped,
    isAuthed: !!user,
    completeLogin,
    logout,
    reloadMe,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Decide where to send the user after login or based on profile state. */
export function nextRouteFor(user) {
  if (!user) return "/login";
  // Buyers stay on /dashboard. Seller-onboarding routes only if they've expressed intent.
  return "/dashboard";
}

export function ProtectedRoute({ children }) {
  const { isAuthed, bootstrapped } = useAuth();
  const location = useLocation();
  if (!bootstrapped) return <BootstrapSplash />;
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthed, bootstrapped } = useAuth();
  if (!bootstrapped) return <BootstrapSplash />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return children;
}

function BootstrapSplash() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500 text-sm font-mono">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        loading slotu…
      </div>
    </div>
  );
}
