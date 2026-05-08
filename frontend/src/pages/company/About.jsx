import React from "react";
import LegalLayout, { H2, P, UL, LI, Card } from "../../components/LegalLayout";

export default function About() {
  return (
    <LegalLayout
      testId="about-page"
      subtitle="Company"
      title="The story behind Slotu"
      lastUpdated={null}
    >
      <P>
        Millions of Indians already share their Netflix, Spotify, Canva and Notion plans with friends — that's the
        whole point of family and team subscriptions. The problem isn't sharing. The problem is the marketplace
        around it.
      </P>
      <P>
        Today, the only way to find someone with a free slot or to fill an empty seat on your own plan is sketchy
        Telegram groups, Reddit threads, and Instagram DMs. People lose money to strangers every single day. Sellers
        get bullied into refunds even when they delivered correctly. There's no trust, no protection, and no
        recourse.
      </P>
      <P>
        Slotu is the missing layer. We built a structured marketplace where every transaction is escrow-protected,
        every seller is verified, and every credential is delivered automatically through an encrypted vault. You
        get the trust of a real platform with the savings of a shared plan.
      </P>

      <H2>What we believe</H2>
      <UL>
        <LI><strong className="text-zinc-100">Sharing should be safe.</strong> Trust shouldn't depend on whether the stranger you DMed turns out to be honest.</LI>
        <LI><strong className="text-zinc-100">Indians deserve modern fintech-grade products.</strong> No more PDF forms, no more "send screenshot of payment".</LI>
        <LI><strong className="text-zinc-100">The platform should make money only when both sides win.</strong> Our commission only triggers on successful, confirmed transactions.</LI>
        <LI><strong className="text-zinc-100">Stay legal, stay sustainable.</strong> We only list services where family or team sharing is officially permitted by their ToS.</LI>
      </UL>

      <H2>How we make money</H2>
      <UL>
        <LI>5–8% commission on each successful transaction (4% for verified Pro sellers)</LI>
        <LI>Slotu Pro — ₹199/month for sellers running 3+ listings, with lower fees and analytics</LI>
        <LI>Future: bulk-seller API for resellers managing 100+ accounts</LI>
      </UL>
      <P>
        We do not run ads. We do not sell your data. The platform is sustainable because the unit economics work
        without those tricks.
      </P>

      <H2>Where we are</H2>
      <Card>
        <div className="text-zinc-200 space-y-1">
          <div><span className="text-zinc-500 text-sm font-mono">HQ:</span> Bengaluru, Karnataka, India</div>
          <div><span className="text-zinc-500 text-sm font-mono">Stage:</span> Pre-launch / waitlist</div>
          <div><span className="text-zinc-500 text-sm font-mono">Status:</span> Indian intermediary under IT Act 2000 §79</div>
        </div>
      </Card>

      <H2>Get in touch</H2>
      <P>
        Have a partnership idea, want to invest, or just want to chat? Email{" "}
        <a className="text-emerald-400 hover:underline" href="mailto:hello@slotu.in">hello@slotu.in</a> or visit our
        <a className="text-emerald-400 hover:underline" href="/contact"> Contact page</a>.
      </P>
    </LegalLayout>
  );
}
