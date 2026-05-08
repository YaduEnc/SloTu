import React from "react";
import LegalLayout, { H2, P, UL, LI, Note, Card } from "../../components/LegalLayout";

export default function Refund() {
  return (
    <LegalLayout
      testId="refund-page"
      subtitle="Legal"
      title="Refund Policy"
      lastUpdated="December 2025"
    >
      <Note>
        <strong className="text-emerald-300">Slotu's escrow guarantees a fair refund.</strong> Your money is held by
        Slotu — never the seller — until you confirm access works. If anything goes wrong, you get your money back.
      </Note>

      <H2>1. When you get a full automatic refund</H2>
      <UL>
        <LI>Payment fails or is dropped during checkout — refund is automatic and immediate.</LI>
        <LI>The seller fails to deliver credentials within 24 hours of payment.</LI>
        <LI>You raise a dispute within 24 hours of credential reveal with proof, and admin rules in your favour.</LI>
        <LI>The seller removes you from the family plan during the paid duration.</LI>
        <LI>Slotu takes down the listing post-purchase due to a ToS violation by the seller.</LI>
      </UL>

      <H2>2. When refunds may be partial</H2>
      <UL>
        <LI>You used the slot for part of the duration before access broke. Refund is pro-rated for unused days.</LI>
        <LI>Admin rules a "split" resolution after a dispute (e.g. 50/50) when fault lies on both sides.</LI>
      </UL>

      <H2>3. When refunds are NOT issued</H2>
      <UL>
        <LI>You confirmed access worked and used the slot for the full duration.</LI>
        <LI>The third-party service (e.g. Netflix) had an outage — that's between you and them, not Slotu.</LI>
        <LI>You shared the credentials with someone outside the slot — Slotu disables the order and refunds nothing.</LI>
        <LI>You raised a dispute after 24 hours of credential reveal without contacting the seller first.</LI>
        <LI>You bypassed Slotu and paid the seller directly — escrow does not apply.</LI>
      </UL>

      <H2>4. How to request a refund</H2>
      <Card title="Step by step">
        <ol className="list-decimal pl-5 space-y-2 text-zinc-300 marker:text-emerald-500">
          <li>Open the order in your buyer dashboard.</li>
          <li>Tap "Raise a dispute".</li>
          <li>Pick a reason: access not working, seller unresponsive, wrong credentials, removed from plan, other.</li>
          <li>Attach evidence — screenshots of error messages, plan-removal notification, etc.</li>
          <li>Slotu admin reviews within 24 hours and decides.</li>
          <li>Approved refunds reach your original payment method within 5–7 business days via Cashfree.</li>
        </ol>
      </Card>

      <H2>5. Refund timelines</H2>
      <UL>
        <LI><strong className="text-zinc-100">UPI</strong>: 1–3 business days</LI>
        <LI><strong className="text-zinc-100">Credit / Debit card</strong>: 5–7 business days</LI>
        <LI><strong className="text-zinc-100">Net-banking</strong>: 5–7 business days</LI>
      </UL>
      <P className="text-sm text-zinc-500">
        Bank processing times are outside Slotu's control. We initiate the refund instantly upon admin approval.
      </P>

      <H2>6. Cancellation by buyer</H2>
      <P>
        You can cancel an order yourself within 5 minutes of creation, before the seller delivers credentials. Funds
        are not captured in this case — there is nothing to refund.
      </P>

      <H2>7. Subscription cancellation (Slotu Pro for sellers)</H2>
      <P>
        Slotu Pro is billed monthly. You can cancel anytime from settings — your Pro benefits remain active until the
        end of the current billing cycle. We do not pro-rate cancellations.
      </P>

      <H2>8. Disputes about refunds</H2>
      <P>
        If you are unhappy with a refund decision, you can escalate to the Grievance Officer within 30 days. See our
        <a className="text-emerald-400 hover:underline" href="/grievance"> Grievance Officer page</a>.
      </P>
    </LegalLayout>
  );
}
