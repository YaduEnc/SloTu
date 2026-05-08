import React from "react";
import { SiNetflix, SiSpotify, SiCanva, SiNotion, SiYoutube, SiPerplexity, SiFigma, SiDropbox, SiPlaystation } from "react-icons/si";

const events = [
  { name: "Aman from Pune", action: "sold a Netflix slot", amount: "₹179", Icon: SiNetflix, color: "#E50914", time: "2 min ago" },
  { name: "Priya from Mumbai", action: "joined Spotify Family", amount: "₹49", Icon: SiSpotify, color: "#1DB954", time: "5 min ago" },
  { name: "Rohan from Delhi", action: "renewed Canva Pro", amount: "₹229", Icon: SiCanva, color: "#00C4CC", time: "11 min ago" },
  { name: "Sneha from Bengaluru", action: "got Notion Plus access", amount: "₹149", Icon: SiNotion, color: "#FFFFFF", time: "14 min ago" },
  { name: "Karan from Hyderabad", action: "sold YouTube Premium", amount: "₹79", Icon: SiYoutube, color: "#FF0000", time: "19 min ago" },
  { name: "Ishita from Chennai", action: "joined Perplexity Pro", amount: "₹399", Icon: SiPerplexity, color: "#1FB8CD", time: "23 min ago" },
  { name: "Vikram from Jaipur", action: "renewed Figma seat", amount: "₹289", Icon: SiFigma, color: "#F24E1E", time: "27 min ago" },
  { name: "Anika from Kolkata", action: "got Dropbox slot", amount: "₹169", Icon: SiDropbox, color: "#0061FF", time: "31 min ago" },
  { name: "Dev from Ahmedabad", action: "joined PS Plus Extra", amount: "₹249", Icon: SiPlaystation, color: "#0070D1", time: "38 min ago" },
];

const Card = ({ ev }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm whitespace-nowrap mx-2">
    <div className="h-9 w-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
      <ev.Icon className="text-base" style={{ color: ev.color }} />
    </div>
    <div className="text-sm">
      <span className="text-zinc-100 font-medium">{ev.name}</span>{" "}
      <span className="text-zinc-400">{ev.action} for </span>
      <span className="font-mono text-emerald-400 font-semibold">{ev.amount}</span>
    </div>
    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 ml-1">{ev.time}</span>
  </div>
);

export default function Activity() {
  return (
    <section
      data-testid="activity-section"
      className="relative py-12 lg:py-16 border-t border-zinc-900 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-6 flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Live activity preview <span className="text-zinc-600">— sample of what your feed will look like</span>
        </span>
      </div>

      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee" style={{ animationDuration: "55s" }}>
          {[...events, ...events].map((ev, i) => (
            <Card key={i} ev={ev} />
          ))}
        </div>
      </div>
    </section>
  );
}
