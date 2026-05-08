import React from "react";
import LegalLayout, { H2, H3, P, UL, LI, Note } from "../../components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      testId="terms-page"
      subtitle="Legal"
      title="Terms of Service"
      lastUpdated="December 2025"
    >
      <P>
        Welcome to Slotu. These Terms of Service ("Terms") govern your access to and use of the Slotu marketplace
        operated by Slotu Technologies Pvt. Ltd. ("Slotu", "we", "us"). By signing up, listing a slot, buying a slot,
        or otherwise using the platform, you agree to these Terms. If you do not agree, do not use Slotu.
      </P>

      <Note>
        <strong className="text-emerald-300">Slotu is a marketplace intermediary, not a service provider.</strong>{" "}
        We connect buyers and sellers of subscription slots that the underlying service permits to be shared with
        family or team members. We are protected under Section 79 of the Information Technology Act, 2000.
      </Note>

      <H2>1. Eligibility</H2>
      <UL>
        <LI>You must be at least 18 years old and an Indian resident to use Slotu.</LI>
        <LI>You must have a valid email address for OTP verification.</LI>
        <LI>Sellers must complete account setup and add a payout UPI before listing.</LI>
      </UL>

      <H2>2. Permitted services only</H2>
      <P>
        Slotu only permits listings on services where shared family or team plans are an officially supported feature
        of that service's own Terms of Service. This includes (non-exhaustive): Netflix Extra Member, Spotify Family,
        YouTube Premium Family, Apple Music Family, Microsoft 365 Family, Google One Family, Canva Pro Teams, Notion
        Teams, Figma Teams. Slotu maintains an allow-list catalog and may remove categories at any time.
      </P>
      <P>
        Listings must be framed as "slot sharing" or "plan member addition". Account selling, credential resale of
        single-user accounts, or anything that violates the underlying provider's ToS is strictly prohibited and will
        result in immediate takedown and possible permanent ban.
      </P>

      <H2>3. Buyer terms</H2>
      <UL>
        <LI>Payment goes into Slotu escrow at checkout — not the seller.</LI>
        <LI>You must confirm access works within 24 hours of credential reveal.</LI>
        <LI>If access does not work, raise a dispute within 24 hours with proof.</LI>
        <LI>Confirmed orders release funds to the seller. Auto-confirm fires after 24 hours of non-action.</LI>
        <LI>Credentials are revealed via a one-time OTP. You agree not to share, resell, or post them anywhere.</LI>
      </UL>

      <H2>4. Seller terms</H2>
      <UL>
        <LI>Listings must be accurate. Misrepresentation = listing removal + reduced trust score.</LI>
        <LI>You must deliver access promptly when notified of a paid order.</LI>
        <LI>You must not remove a buyer from a plan during the duration paid for.</LI>
        <LI>Slotu charges 5–8% commission per successful transaction (4% for verified Pro sellers).</LI>
        <LI>Payouts are released to your verified UPI ID after the buyer confirms or auto-confirm fires.</LI>
        <LI>You are responsible for tax compliance on income earned through Slotu.</LI>
      </UL>

      <H2>5. Prohibited conduct</H2>
      <UL>
        <LI>Listing services not on the Slotu allow-list.</LI>
        <LI>Listing accounts you do not legitimately own.</LI>
        <LI>Sharing buyer or seller PII collected via the platform.</LI>
        <LI>Coordinating payment outside Slotu (this voids escrow protection and gets both parties banned).</LI>
        <LI>Creating multiple accounts to manipulate trust scores.</LI>
        <LI>Any activity that violates Indian law or third-party service ToS.</LI>
      </UL>

      <H2>6. Fees</H2>
      <P>
        Buyers pay zero platform fee on top of the listing price. Sellers pay 5–8% commission per successful sale,
        deducted from the payout amount before transfer. Slotu Pro is a paid seller subscription at ₹199/month
        offering reduced 4% commission, boosted listings, and analytics. Fees are subject to change with 30 days
        notice.
      </P>

      <H2>7. Refunds</H2>
      <P>
        Full refunds are issued automatically when (a) payment fails, (b) seller does not deliver access, (c) buyer
        successfully disputes within 24 hours of delivery and admin rules in their favour. See our Refund Policy for
        full details.
      </P>

      <H2>8. Dispute resolution</H2>
      <P>
        Either party may raise a dispute on any active order. The Slotu admin team reviews evidence within 24 hours
        and rules in favour of the buyer, the seller, or splits the resolution. Slotu's decision is final for the
        purposes of escrow release. Parties retain their statutory rights to legal recourse outside the platform.
      </P>

      <H2>9. Suspension and termination</H2>
      <P>
        Slotu may suspend or terminate any account at any time for violations of these Terms, with or without notice.
        Funds in escrow are released or refunded according to order state. Pending payouts to terminated sellers may
        be held pending dispute resolution.
      </P>

      <H2>10. Intermediary status</H2>
      <P>
        Slotu acts solely as a marketplace intermediary as defined under Section 79 of the IT Act, 2000. Slotu does
        not own, control, or guarantee any third-party subscription service. Disputes regarding the underlying
        service's content, availability, or quality are between the buyer and the original service provider.
      </P>

      <H2>11. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, Slotu's total liability for any claim arising from your use of the
        platform shall not exceed the platform fees Slotu actually retained from the disputed transaction. Slotu is
        not liable for indirect, incidental, or consequential damages.
      </P>

      <H2>12. Governing law</H2>
      <P>
        These Terms are governed by the laws of India. Exclusive jurisdiction lies with the courts of Bengaluru,
        Karnataka.
      </P>

      <H2>13. Grievance Officer</H2>
      <P>
        In accordance with the Information Technology Rules, 2021, our Grievance Officer can be contacted at
        <a className="text-emerald-400 hover:underline" href="mailto:grievance@slotu.in"> grievance@slotu.in</a>.
        See our <a className="text-emerald-400 hover:underline" href="/grievance">Grievance Officer page</a> for full
        contact details and complaint procedure.
      </P>

      <H2>14. Changes</H2>
      <P>
        We may update these Terms occasionally. Material changes will be notified via email and an in-app banner at
        least 7 days before they take effect. Continued use after the effective date constitutes acceptance.
      </P>
    </LegalLayout>
  );
}
