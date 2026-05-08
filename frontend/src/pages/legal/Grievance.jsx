import React from "react";
import LegalLayout, { H2, P, UL, LI, Note, Card } from "../../components/LegalLayout";

export default function Grievance() {
  return (
    <LegalLayout
      testId="grievance-page"
      subtitle="Legal"
      title="Grievance Officer"
      lastUpdated="December 2025"
    >
      <P>
        In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules,
        2021, Slotu has appointed a Grievance Officer to address user complaints about content, conduct, payments,
        and privacy on the platform.
      </P>

      <Note>
        Acknowledgement within <strong className="text-emerald-300">24 hours</strong>. Resolution within{" "}
        <strong className="text-emerald-300">15 days</strong> as required by IT Rules 2021.
      </Note>

      <H2>Contact details</H2>

      <Card title="Grievance Officer">
        <div className="space-y-2 text-zinc-200">
          <div><span className="text-zinc-500 text-sm font-mono">Name:</span> To be appointed</div>
          <div><span className="text-zinc-500 text-sm font-mono">Email:</span>{" "}
            <a className="text-emerald-400 hover:underline" href="mailto:grievance@slotu.in">grievance@slotu.in</a>
          </div>
          <div><span className="text-zinc-500 text-sm font-mono">Phone:</span> +91 80 4567 8900 (Mon–Fri, 10:00–18:00 IST)</div>
          <div><span className="text-zinc-500 text-sm font-mono">Postal address:</span><br />
            <span className="block mt-1">
              Slotu Technologies Pvt. Ltd.<br />
              Attn: Grievance Officer<br />
              [Office address to be added]<br />
              Bengaluru, Karnataka, India
            </span>
          </div>
        </div>
      </Card>

      <H2>How to file a complaint</H2>
      <P>Please include the following in your email or letter so we can resolve quickly:</P>
      <UL>
        <LI>Your registered mobile number on Slotu</LI>
        <LI>Order number (if applicable) — format <code className="font-mono text-emerald-400 text-sm">SLOT-YYYY-NNNNNN</code></LI>
        <LI>A clear description of the grievance and what outcome you are seeking</LI>
        <LI>Screenshots, files, or any other evidence supporting your complaint</LI>
        <LI>Your preferred contact channel for follow-up (email or phone)</LI>
      </UL>

      <H2>What we resolve</H2>
      <UL>
        <LI>Order disputes that the standard dispute flow could not resolve</LI>
        <LI>Refund issues</LI>
        <LI>Account suspension or content takedown disagreements</LI>
        <LI>Privacy concerns (DPDP Act rights)</LI>
        <LI>Reports of unlawful content or harassment</LI>
        <LI>Complaints regarding misuse of personal data</LI>
      </UL>

      <H2>Escalation</H2>
      <P>
        If you are not satisfied with the Grievance Officer's resolution, you may escalate to the appellate
        authorities under Section 79 of the IT Act, 2000, including the Grievance Appellate Committee constituted by
        the Government of India.
      </P>

      <H2>Reporting unlawful content</H2>
      <P>
        If you believe a listing or user is engaged in unlawful activity, fraud, or violates a third-party service's
        terms in a way that harms users, please email{" "}
        <a className="text-emerald-400 hover:underline" href="mailto:abuse@slotu.in">abuse@slotu.in</a>. Slotu will
        review and act within 36 hours as required by IT Rules 2021.
      </P>

      <H2>Compliance officers</H2>
      <P>
        Once Slotu crosses the user thresholds defined for "significant social media intermediaries", we will appoint
        and publish details for the Chief Compliance Officer, Nodal Contact Person, and Resident Grievance Officer
        as required.
      </P>
    </LegalLayout>
  );
}
