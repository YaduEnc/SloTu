import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Waitlist() {
  const [role, setRole] = useState("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please add your name and email");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("That email doesn't look right");
      return;
    }
    setSubmitted(true);
    toast.success(`You're on the waitlist as a ${role}!`, {
      description: "We'll email you the moment Slotu opens up.",
    });
  };

  return (
    <section
      id="waitlist"
      data-testid="waitlist-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900 overflow-hidden"
    >
      <div className="absolute inset-0 radial-fade opacity-70 pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-emerald-300 tracking-wide">
            Founding member access
          </span>
        </div>

        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
          Be first when we launch.
        </h2>
        <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto">
          Join the waitlist and get founding member perks — lower fees, free Pro for 3 months, and a verified badge from day one.
        </p>

        <div className="mt-10 mx-auto max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-6 md:p-8 text-left">
          {submitted ? (
            <div className="flex flex-col items-center text-center py-6" data-testid="waitlist-success">
              <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-zinc-50">You're in.</h3>
              <p className="mt-2 text-zinc-400 text-sm">
                We saved your spot as a <span className="text-emerald-400 font-medium">{role}</span>. Look out for an email soon.
              </p>
              <button
                onClick={() => { setSubmitted(false); setName(""); setEmail(""); }}
                className="mt-6 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
                data-testid="waitlist-reset"
              >
                Add another person
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="waitlist-form">
              <Tabs value={role} onValueChange={setRole}>
                <TabsList className="grid grid-cols-2 w-full bg-zinc-950 border border-zinc-800 p-1 h-auto">
                  <TabsTrigger
                    value="buyer"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-emerald-950 text-zinc-400 py-2.5 rounded-md font-medium text-sm"
                    data-testid="waitlist-tab-buyer"
                  >
                    I want to buy slots
                  </TabsTrigger>
                  <TabsTrigger
                    value="seller"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-emerald-950 text-zinc-400 py-2.5 rounded-md font-medium text-sm"
                    data-testid="waitlist-tab-seller"
                  >
                    I want to sell slots
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2 block">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 h-11 text-zinc-100"
                    data-testid="waitlist-input-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 focus-visible:ring-emerald-500/20 h-11 text-zinc-100"
                    data-testid="waitlist-input-email"
                  />
                </div>
              </div>

              <button
                type="submit"
                data-testid="waitlist-submit"
                className="group w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-3.5 text-base font-semibold transition-all hover:translate-y-[-1px]"
              >
                Reserve my spot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <p className="text-[11px] text-zinc-500 text-center font-mono">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
