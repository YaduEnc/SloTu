import React from "react";
import LegalLayout, { H2, P, Card } from "../../components/LegalLayout";
import { Mail, MessageSquare, ShieldAlert, Handshake } from "lucide-react";

const contacts = [
  { Icon: Mail, label: "General", email: "hello@slotu.in", note: "Anything not covered below" },
  { Icon: MessageSquare, label: "Support", email: "support@slotu.in", note: "Order issues, account help" },
  { Icon: ShieldAlert, label: "Grievance", email: "grievance@slotu.in", note: "Formal complaints, IT Act" },
  { Icon: Handshake, label: "Partnerships", email: "partners@slotu.in", note: "Press, investors, business" },
];

export default function Contact() {
  return (
    <LegalLayout
      testId="contact-page"
      subtitle="Company"
      title="Get in touch"
      lastUpdated={null}
    >
      <P>
        Slotu is pre-launch, so the fastest way to reach us is email. Pick the right channel below and we'll get
        back within one business day.
      </P>

      <div className="grid sm:grid-cols-2 gap-4 mt-12">
        {contacts.map((c) => {
          const Icon = c.Icon;
          return (
            <a
              key={c.email}
              href={`mailto:${c.email}`}
              data-testid={`contact-${c.label.toLowerCase()}`}
              className="group block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/40 transition-colors">
                <Icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-500">{c.label}</div>
              <div className="mt-1 text-zinc-50 font-display text-lg">{c.email}</div>
              <div className="mt-1 text-sm text-zinc-400">{c.note}</div>
            </a>
          );
        })}
      </div>

      <H2>Office</H2>
      <Card>
        <div className="text-zinc-200 leading-relaxed">
          Slotu Technologies Pvt. Ltd.<br />
          [Office address to be added]<br />
          Bengaluru, Karnataka, India
        </div>
      </Card>

      <H2>Press &amp; media</H2>
      <P>
        For press kits, founder interviews, or product screenshots, email{" "}
        <a className="text-emerald-400 hover:underline" href="mailto:press@slotu.in">press@slotu.in</a>.
      </P>
    </LegalLayout>
  );
}
