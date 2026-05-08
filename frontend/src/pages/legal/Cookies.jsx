import React from "react";
import LegalLayout, { H2, P, UL, LI, Note } from "../../components/LegalLayout";

export default function Cookies() {
  return (
    <LegalLayout
      testId="cookies-page"
      subtitle="Legal"
      title="Cookie Policy"
      lastUpdated="December 2025"
    >
      <Note>
        Slotu uses the absolute minimum cookies needed to keep you logged in. We do not use advertising,
        cross-site tracking, or analytics cookies.
      </Note>

      <H2>What is a cookie?</H2>
      <P>
        A cookie is a small text file stored on your device by your browser. Slotu uses cookies only where strictly
        necessary for the platform to work (specifically: keeping you logged in).
      </P>

      <H2>Cookies we use</H2>

      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_2fr] text-xs font-mono uppercase tracking-widest text-zinc-500 bg-zinc-900 px-5 py-3 border-b border-zinc-800">
          <div>Name</div>
          <div>Type</div>
          <div>Lifetime</div>
          <div>Purpose</div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr_2fr] text-sm text-zinc-200 px-5 py-4">
          <div className="font-mono text-emerald-400">slotu_rt</div>
          <div>Strictly necessary</div>
          <div>7 days</div>
          <div>Refresh-token cookie. Keeps you signed in. HttpOnly + Secure + SameSite=Lax.</div>
        </div>
      </div>

      <H2>What we do NOT use</H2>
      <UL>
        <LI>Advertising cookies</LI>
        <LI>Cross-site tracking cookies</LI>
        <LI>Third-party analytics cookies (we use server-side analytics with no PII)</LI>
        <LI>Social media share/track pixels</LI>
        <LI>Remarketing cookies</LI>
      </UL>

      <H2>Local storage</H2>
      <P>
        We use your browser's local storage only to remember UI preferences (e.g. your last waitlist tab choice).
        This data never leaves your device and is not used for tracking.
      </P>

      <H2>Managing cookies</H2>
      <P>
        Because we only use a strictly-necessary session cookie, no consent banner is required under the DPDP Act.
        You can delete the <code className="font-mono text-emerald-400 text-sm">slotu_rt</code> cookie at any time
        from your browser — you will simply be signed out.
      </P>

      <H2>Changes</H2>
      <P>
        If we ever start using analytics or third-party cookies, we will update this page and ask for explicit
        consent before setting any non-essential cookie.
      </P>
    </LegalLayout>
  );
}
