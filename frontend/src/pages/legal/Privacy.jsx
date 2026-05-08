import React from "react";
import LegalLayout, { H2, H3, P, UL, LI, Note } from "../../components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      testId="privacy-page"
      subtitle="Legal"
      title="Privacy Policy"
      lastUpdated="December 2025"
    >
      <P>
        This Privacy Policy explains what personal data Slotu Technologies Pvt. Ltd. collects, how we use it, and
        your rights under India's Digital Personal Data Protection Act, 2023 ("DPDP Act") and applicable rules.
      </P>

      <Note>
        Short version: we collect the minimum needed to run an escrow marketplace safely. We never sell your data.
        Card details are handled by Cashfree, never us. Login happens through email OTP and seller onboarding is kept lightweight until deeper verification is truly needed.
      </Note>

      <H2>1. Data we collect</H2>

      <H3>From all users</H3>
      <UL>
        <LI>Email address (mandatory, for OTP login)</LI>
        <LI>Name</LI>
        <LI>Device IP address, user-agent, and login timestamps</LI>
      </UL>

      <H3>From sellers (in addition)</H3>
      <UL>
        <LI>UPI ID (for payouts)</LI>
        <LI>Bank account details if you opt for bank transfer payouts</LI>
        <LI>KYC documents you upload, encrypted at rest in Cloudflare R2</LI>
      </UL>

      <H3>Transaction data</H3>
      <UL>
        <LI>Listings you create or buy</LI>
        <LI>Reviews, ratings, disputes, evidence files</LI>
        <LI>Encrypted credential vault entries (AES-256-GCM, never decryptable in any backup or log)</LI>
      </UL>

      <H3>What we do NOT collect</H3>
      <UL>
        <LI>Your card or net-banking credentials (handled by Cashfree, RBI-licensed)</LI>
        <LI>Biometric data</LI>
        <LI>Browsing history outside Slotu</LI>
      </UL>

      <H2>2. How we use your data</H2>
      <UL>
        <LI>To authenticate you via OTP</LI>
        <LI>To process payments and payouts via Cashfree</LI>
        <LI>To deliver order notifications via SMS, email, and in-app channels</LI>
        <LI>To detect fraud, abuse, and ToS violations</LI>
        <LI>To provide customer support and resolve disputes</LI>
        <LI>To comply with Indian law and respond to lawful government requests</LI>
        <LI>To improve the product (aggregated analytics, no personally-identifiable export)</LI>
      </UL>

      <H2>3. Who we share data with</H2>
      <UL>
        <LI><strong className="text-zinc-100">Cashfree Payments</strong> — for payment processing (RBI-licensed)</LI>
        <LI><strong className="text-zinc-100">Resend</strong> — to send transactional OTP and product emails</LI>
        <LI><strong className="text-zinc-100">Cloudflare R2</strong> — to store KYC documents and dispute evidence (encrypted)</LI>
        <LI><strong className="text-zinc-100">Government / law enforcement</strong> — only when legally compelled, with notice to you wherever permitted</LI>
      </UL>
      <P>We do not sell your personal data. We do not run advertising on Slotu.</P>

      <H2>4. Data retention</H2>
      <UL>
        <LI>Active accounts: data retained while your account is active</LI>
        <LI>Deleted accounts: 180 days for legal and dispute compliance, then purged</LI>
        <LI>Audit logs: 365 days, then archived to encrypted cold storage</LI>
        <LI>OTP records: 24 hours, then auto-deleted</LI>
        <LI>Encrypted credential vault: deleted within 7 days of listing removal</LI>
      </UL>

      <H2>5. Your rights under the DPDP Act</H2>
      <UL>
        <LI><strong className="text-zinc-100">Right to access</strong> your personal data — request a data export from your dashboard</LI>
        <LI><strong className="text-zinc-100">Right to correction</strong> of inaccurate data — edit anytime in settings</LI>
        <LI><strong className="text-zinc-100">Right to erasure</strong> — delete your account from settings (subject to 180-day retention for compliance)</LI>
        <LI><strong className="text-zinc-100">Right to grievance redressal</strong> — see our <a className="text-emerald-400 hover:underline" href="/grievance">Grievance Officer page</a></LI>
        <LI><strong className="text-zinc-100">Right to nominate</strong> a person who can exercise your rights in case of incapacity</LI>
      </UL>

      <H2>6. Security measures</H2>
      <UL>
        <LI>HTTPS-only with TLS 1.2+ on all endpoints</LI>
        <LI>AES-256-GCM encryption for credential vault</LI>
        <LI>Bcrypt hashing for OTP records</LI>
        <LI>JWT short-lived tokens with refresh rotation</LI>
        <LI>Webhook signature verification on every payment event</LI>
        <LI>Rate limiting, automated abuse detection, audit logs</LI>
        <LI>Annual penetration testing by an independent firm</LI>
      </UL>

      <H2>7. Cookies</H2>
      <P>
        We use one strictly-necessary cookie (<code className="text-emerald-400 font-mono text-sm">slotu_rt</code>)
        to maintain your authenticated session. We do not use third-party analytics or advertising trackers. See our
        <a className="text-emerald-400 hover:underline" href="/cookies"> Cookie Policy</a> for full detail.
      </P>

      <H2>8. Children</H2>
      <P>
        Slotu is not directed at users under 18. We do not knowingly collect personal data from minors. If you believe
        a minor has registered, contact our Grievance Officer for immediate account deletion.
      </P>

      <H2>9. International transfers</H2>
      <P>
        Most data is stored in India. Some processors (e.g. Resend for email) may store transient logs outside
        India under standard contractual clauses. Encrypted credentials and KYC documents are stored on Cloudflare R2
        in an India-hosted bucket where available.
      </P>

      <H2>10. Breach notification</H2>
      <P>
        In the unlikely event of a personal-data breach, we will notify CERT-In within 6 hours and affected users
        within 72 hours via email and in-app banner, with steps you can take to protect yourself.
      </P>

      <H2>11. Contact</H2>
      <P>
        For privacy questions, email <a className="text-emerald-400 hover:underline" href="mailto:privacy@slotu.in">privacy@slotu.in</a>.
        For formal grievances, see the <a className="text-emerald-400 hover:underline" href="/grievance">Grievance Officer page</a>.
      </P>
    </LegalLayout>
  );
}
