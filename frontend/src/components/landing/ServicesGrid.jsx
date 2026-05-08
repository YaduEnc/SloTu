import React from "react";
import {
  SiNetflix, SiSpotify, SiApplemusic, SiYoutube, SiCanva, SiFigma,
  SiFramer, SiNotion, SiDropbox, SiPerplexity, SiGooglegemini, SiCoursera,
  SiSkillshare, SiPlaystation, SiNordvpn, SiSurfshark, SiDiscord, SiSony,
  SiOpenai, SiJio, SiClaude
} from "react-icons/si";

// Hybrid catalogue: real icons where available, custom letter logos otherwise
const row1 = [
  { type: "icon", Icon: SiNetflix, name: "Netflix", color: "#E50914" },
  { type: "letter", letter: "P", name: "Prime Video", color: "#00A8E1" },
  { type: "icon", Icon: SiJio, name: "JioCinema", color: "#E60022" },
  { type: "letter", letter: "H", name: "Hotstar", color: "#1F80E0" },
  { type: "icon", Icon: SiSony, name: "SonyLIV", color: "#1A1A1A" },
  { type: "icon", Icon: SiSpotify, name: "Spotify", color: "#1DB954" },
  { type: "icon", Icon: SiApplemusic, name: "Apple Music", color: "#FA243C" },
  { type: "icon", Icon: SiYoutube, name: "YouTube Premium", color: "#FF0000" },
  { type: "icon", Icon: SiCanva, name: "Canva Pro", color: "#00C4CC" },
  { type: "icon", Icon: SiFigma, name: "Figma", color: "#F24E1E" },
  { type: "icon", Icon: SiNotion, name: "Notion", color: "#FFFFFF" },
  { type: "icon", Icon: SiDropbox, name: "Dropbox", color: "#0061FF" },
];

const row2 = [
  { type: "icon", Icon: SiPerplexity, name: "Perplexity Pro", color: "#1FB8CD" },
  { type: "icon", Icon: SiGooglegemini, name: "Gemini Advanced", color: "#8E75F8" },
  { type: "icon", Icon: SiOpenai, name: "ChatGPT Plus", color: "#10A37F" },
  { type: "icon", Icon: SiClaude, name: "Claude Pro", color: "#D97757" },
  { type: "icon", Icon: SiFramer, name: "Framer", color: "#FFFFFF" },
  { type: "letter", letter: "A", name: "Adobe CC", color: "#DA1F26" },
  { type: "icon", Icon: SiCoursera, name: "Coursera Plus", color: "#0056D2" },
  { type: "letter", letter: "in", name: "LinkedIn Learning", color: "#0A66C2" },
  { type: "icon", Icon: SiSkillshare, name: "Skillshare", color: "#00FF84" },
  { type: "icon", Icon: SiPlaystation, name: "PS Plus", color: "#0070D1" },
  { type: "icon", Icon: SiNordvpn, name: "NordVPN", color: "#4687FF" },
  { type: "icon", Icon: SiSurfshark, name: "Surfshark", color: "#1EBFBF" },
  { type: "icon", Icon: SiDiscord, name: "Discord Nitro", color: "#5865F2" },
];

const Pill = ({ item }) => {
  const { name, color } = item;
  return (
    <div className="group flex items-center gap-3 px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm whitespace-nowrap mx-2 hover:border-zinc-700 hover:bg-zinc-900 transition-colors">
      <div className="h-7 w-7 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
        {item.type === "icon" ? (
          <item.Icon
            className="text-base transition-colors"
            style={{ color }}
          />
        ) : (
          <span
            className="text-[11px] font-display font-bold tracking-tight"
            style={{ color }}
          >
            {item.letter}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-zinc-300">{name}</span>
    </div>
  );
};

const Marquee = ({ items, reverse = false }) => (
  <div className="relative overflow-hidden">
    <div className={`flex w-max ${reverse ? "animate-marquee-reverse" : "animate-marquee"}`}>
      {[...items, ...items].map((item, i) => (
        <Pill key={`${item.name}-${i}`} item={item} />
      ))}
    </div>
  </div>
);

export default function ServicesGrid() {
  return (
    <section
      id="services"
      data-testid="services-section"
      className="relative py-24 lg:py-32 border-t border-zinc-900 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-12">
        <div className="grid lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4">
              Supported services
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-zinc-50 leading-[1.05]">
              25+ subscriptions.
              <br />
              <span className="text-zinc-500">All under one roof.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <p className="text-zinc-400 text-base lg:text-lg max-w-md lg:ml-auto">
              From streaming and music to AI tools and design suites — Slotu only lists services where family or team sharing is allowed by ToS.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <Marquee items={row1} />
        <Marquee items={row2} reverse />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {["Video", "Music", "Design", "Productivity", "AI Tools", "Learning", "Gaming"].map((cat) => (
            <div
              key={cat}
              data-testid={`category-${cat.toLowerCase().replace(' ', '-')}`}
              className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center text-sm text-zinc-300 hover:bg-zinc-900 hover:border-emerald-500/40 transition-colors cursor-pointer"
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
