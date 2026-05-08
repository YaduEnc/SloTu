import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Shield, LogOut, User, LayoutDashboard, Store, Menu, X } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Toaster } from "../ui/sonner";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/profile", icon: User, label: "Profile" },
  { to: "/seller", icon: Store, label: "Seller" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const initials =
    (user?.name || user?.phone || "U")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50" data-testid="app-shell">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/85 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="app-logo">
              <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-emerald-950">
                <Shield className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">slotu</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  data-testid={`nav-${n.label.toLowerCase()}`}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "text-zinc-50 bg-zinc-900"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-mono text-zinc-500">{user?.phone}</div>
                <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-mono">{user?.role}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-emerald-500 text-emerald-950 font-display font-bold flex items-center justify-center">
                {initials}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              data-testid="logout-btn"
              className="hidden md:inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-zinc-50 px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-zinc-800"
              data-testid="app-mobile-toggle"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-zinc-900 bg-zinc-950">
            <nav className="px-5 py-3 flex flex-col gap-1">
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm ${
                      isActive ? "bg-zinc-900 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900/60"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => { setOpen(false); handleLogout(); }}
                className="mt-2 px-3 py-2.5 rounded-lg text-sm text-left text-zinc-400 hover:bg-zinc-900/60"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8 lg:py-12">{children}</main>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
