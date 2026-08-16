import React, { useState } from "react";
import {
    Sparkles,
    ArrowRight,
    Camera,
    Cpu,
    ClipboardList,
    Droplets,
    Sun,
    Activity,
    CircleDot,
    Moon,
    Check,
    Star,
    ScanLine,
} from "lucide-react";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
} from "recharts";

/* ---------------------------------------------------------------
   Lumina — AI skin analysis landing page
   Colors match the app's existing PALETTE exactly:
     primary #6B3A52 · accent #C4859A · muted #8C7B75
   Extra tokens (background/card/secondary/border) are derived
   to sit naturally around that same primary.
--------------------------------------------------------------- */

const PALETTE = {
    primary: "#6B3A52",
    primaryForeground: "#FFF9FB",
    accent: "#C4859A",
    muted: "#8C7B75",
    grid: "rgba(107, 58, 82, 0.08)",
    background: "#FBF8F6",
    foreground: "#241922",
    card: "#FFFFFF",
    secondary: "#F3E9ED",
    border: "rgba(107, 58, 82, 0.14)",
};

const radarData = [
    { subject: "Oily", value: 62 },
    { subject: "Dry", value: 28 },
    { subject: "Wrinkle", value: 34 },
    { subject: "Acne", value: 48 },
    { subject: "Dark Spots", value: 55 },
];

const trackingData = [
    { week: "Wk 1", score: 61 },
    { week: "Wk 2", score: 65 },
    { week: "Wk 3", score: 69 },
    { week: "Wk 4", score: 74 },
    { week: "Wk 5", score: 79 },
    { week: "Wk 6", score: 85 },
];

const signals = [
    { icon: Droplets, name: "Oily", copy: "Excess sebum and shine, mapped across your T-zone and cheeks." },
    { icon: Sun, name: "Dry", copy: "Flaking, tightness, and moisture loss, read from skin texture." },
    { icon: Activity, name: "Wrinkle", copy: "Fine lines and depth around the eyes, forehead, and mouth." },
    { icon: CircleDot, name: "Acne", copy: "Active breakouts, texture, and inflammation, spotted and counted." },
    { icon: Moon, name: "Dark Spots", copy: "Hyperpigmentation and sun damage, mapped by tone variance." },
];

const steps = [
    { n: "01", icon: Camera, title: "Upload a selfie", copy: "Natural light, no filter, face forward. Takes about ten seconds." },
    { n: "02", icon: Cpu, title: "AI reads five signals", copy: "Oiliness, dryness, wrinkles, acne, and dark spots, scored independently." },
    { n: "03", icon: ClipboardList, title: "Get your plan", copy: "Concerns ranked, ingredients matched, a routine built for what your skin needs today." },
];

const routine = [
    { time: "AM", items: ["Gentle cleanser", "Niacinamide serum", "SPF 50"] },
    { time: "PM", items: ["Oil cleanse", "Salicylic acid (2x/wk)", "Ceramide moisturizer"] },
];

const testimonials = [
    { initials: "MJ", name: "Maya J.", note: "Combination skin, 6 weeks in", quote: "The weekly chart is what kept me consistent. I could finally see the acne score actually dropping." },
    { initials: "RK", name: "Ravi K.", note: "Oily skin, 3 months in", quote: "It caught dehydration under the oil that I'd been treating completely wrong for years." },
    { initials: "SC", name: "Sofia C.", note: "Dry skin, 4 weeks in", quote: "Routine felt short enough to stick to. Three steps, not fifteen." },
];

function GlobalStyle() {
    return (
        <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      .lum-root { font-family: 'Inter', sans-serif; }
      .lum-display { font-family: 'Fraunces', serif; }
      .lum-mono { font-family: 'IBM Plex Mono', monospace; }
      @keyframes lumFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
      .lum-reveal { animation: lumFadeUp 0.9s cubic-bezier(.22,.61,.36,1) both; }
      @keyframes lumScan { 0% { top: 6%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 92%; opacity: 0; } }
      .lum-scanline { animation: lumScan 3.2s ease-in-out infinite; }
      @keyframes lumPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      .lum-pulse { animation: lumPulse 2.2s ease-in-out infinite; }
    `}</style>
    );
}

function BrowserFrame({ label, children }) {
    return (
        <div
            className="rounded-[22px] overflow-hidden border shadow-[0_35px_70px_-30px_rgba(107,58,82,0.35)]"
            style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.card }}
        >
            <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.secondary }}
            >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE.accent }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE.muted }} />
                <span className="w-2.5 h-2.5 rounded-full opacity-40" style={{ backgroundColor: PALETTE.primary }} />
                <span
                    className="lum-mono text-[10px] ml-3 px-2.5 py-1 rounded-full"
                    style={{ color: PALETTE.muted, backgroundColor: PALETTE.background }}
                >
                    {label}
                </span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export function LandingPage({ onLoginClick, onRegisterClick }) {
    const [hoverStep, setHoverStep] = useState(null);

    return (
        <div
            className="lum-root min-h-screen w-full overflow-hidden"
            style={{ backgroundColor: PALETTE.background, color: PALETTE.foreground }}
        >
            <GlobalStyle />

            {/* NAV */}
            <nav
                className="sticky top-0 z-50 backdrop-blur-md border-b"
                style={{ backgroundColor: `${PALETTE.background}CC`, borderColor: PALETTE.border }}
            >
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: PALETTE.primary }}>
                            <Sparkles size={13} style={{ color: PALETTE.primaryForeground }} />
                        </div>
                        <span className="lum-display text-lg tracking-tight">Lumina</span>
                    </div>
                    {/* <div className="hidden sm:flex items-center gap-8 text-[13px] font-medium" style={{ color: `${PALETTE.foreground}99` }}>
                        <span>How it works</span>
                        <span>The five signals</span>
                        <span>Tracking</span>
                    </div> */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onRegisterClick}
                            className="text-[13px] font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: PALETTE.primary, color: PALETTE.primaryForeground }}
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <header className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-16 items-center">
                <div className="absolute -top-24 -right-40 w-[420px] h-[420px] rounded-full blur-[110px] pointer-events-none" style={{ backgroundColor: `${PALETTE.accent}26` }} />

                <div className="relative lum-reveal">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold tracking-[0.08em] uppercase mb-6"
                        style={{ borderColor: PALETTE.border, color: PALETTE.primary }}
                    >
                        <Sparkles size={12} />
                        AI Dermal Analysis
                    </div>
                    <h1 className="lum-display text-5xl lg:text-6xl leading-[1.08] font-medium tracking-tight">
                        Your skin,
                        <br />
                        read like data.
                    </h1>
                    <p className="mt-6 text-[16px] leading-relaxed max-w-md" style={{ color: `${PALETTE.foreground}A6` }}>
                        Upload a selfie. Lumina's AI reads five signals — oil, dryness,
                        wrinkles, acne, and dark spots — and turns them into a score, a
                        plan, and a routine you'll actually follow.
                    </p>
                    <div className="mt-9 flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onRegisterClick}
                            className="group px-7 py-3.5 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            style={{ backgroundColor: PALETTE.primary, color: PALETTE.primaryForeground }}
                        >
                            Analyze my skin
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="px-7 py-3.5 rounded-xl text-[14px] font-semibold border hover:opacity-80 transition-opacity"
                            style={{ borderColor: PALETTE.border }}
                        >
                            See how it works
                        </button>
                    </div>

                    <div className="mt-10 flex items-center gap-5">
                        <div className="flex -space-x-2.5">
                            {["MJ", "RK", "SC", "TL"].map((i) => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                                    style={{ borderColor: PALETTE.background, backgroundColor: PALETTE.secondary, color: PALETTE.primary }}
                                >
                                    {i}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-[13px]">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={13} fill={PALETTE.accent} stroke="none" />
                                ))}
                            </div>
                            <span style={{ color: `${PALETTE.foreground}80` }}>4.8 from early users</span>
                        </div>
                    </div>
                </div>

                {/* SCREENSHOT 1 — live scan mockup */}
                <div className="relative lum-reveal" style={{ animationDelay: "150ms" }}>
                    <BrowserFrame label="lumina.app/scan">
                        <div className="relative rounded-2xl overflow-hidden h-[300px]" style={{ backgroundColor: PALETTE.secondary }}>
                            {/* abstract face silhouette, no real photo — layered soft gradients */}
                            <div
                                className="absolute left-1/2 top-1/2 w-[150px] h-[190px] rounded-[50%] -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    background: `radial-gradient(circle at 40% 30%, ${PALETTE.accent}55, transparent 60%), radial-gradient(circle at 65% 70%, ${PALETTE.primary}40, transparent 55%), ${PALETTE.card}`,
                                }}
                            />
                            {/* scan line */}
                            <div
                                className="lum-scanline absolute left-[26%] right-[26%] h-[2px] rounded-full"
                                style={{ backgroundColor: PALETTE.accent, boxShadow: `0 0 12px 2px ${PALETTE.accent}` }}
                            />
                            {/* callout chips */}
                            <div className="absolute left-4 top-8 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full lum-pulse" style={{ backgroundColor: PALETTE.primary }} />
                                <span className="lum-mono text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: PALETTE.card, color: PALETTE.primary, border: `1px solid ${PALETTE.border}` }}>
                                    T-zone: oily
                                </span>
                            </div>
                            <div className="absolute right-4 top-20 flex items-center gap-2">
                                <span className="lum-mono text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: PALETTE.card, color: PALETTE.primary, border: `1px solid ${PALETTE.border}` }}>
                                    Fine lines: mild
                                </span>
                                <span className="w-1.5 h-1.5 rounded-full lum-pulse" style={{ backgroundColor: PALETTE.primary, animationDelay: "0.4s" }} />
                            </div>
                            <div className="absolute left-6 bottom-10 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full lum-pulse" style={{ backgroundColor: PALETTE.primary, animationDelay: "0.8s" }} />
                                <span className="lum-mono text-[10px] px-2 py-1 rounded-md" style={{ backgroundColor: PALETTE.card, color: PALETTE.primary, border: `1px solid ${PALETTE.border}` }}>
                                    Dark spots: cheek
                                </span>
                            </div>
                            <div className="absolute inset-x-0 bottom-3 flex justify-center">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: PALETTE.card, border: `1px solid ${PALETTE.border}`, color: PALETTE.foreground }}>
                                    <ScanLine size={12} style={{ color: PALETTE.accent }} />
                                    Analyzing... 5 of 5 signals
                                </div>
                            </div>
                        </div>
                    </BrowserFrame>
                </div>
            </header>

            {/* HOW IT WORKS — dark band */}
            <section className="py-24" style={{ backgroundColor: PALETTE.primary, color: PALETTE.primaryForeground }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="max-w-lg mb-16 lum-reveal">
                        <span className="lum-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: PALETTE.accent }}>
                            How it works
                        </span>
                        <h2 className="lum-display text-3xl lg:text-4xl mt-3 font-medium leading-tight">
                            Three steps between a photo and a plan.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {steps.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={s.n}
                                    onMouseEnter={() => setHoverStep(i)}
                                    onMouseLeave={() => setHoverStep(null)}
                                    className="lum-reveal border-t pt-6"
                                    style={{ borderColor: `${PALETTE.primaryForeground}26`, animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="lum-mono text-[13px]" style={{ color: PALETTE.accent }}>{s.n}</span>
                                        <Icon size={18} style={{ color: hoverStep === i ? PALETTE.accent : `${PALETTE.primaryForeground}66` }} />
                                    </div>
                                    <h3 className="lum-display text-xl font-medium mb-2">{s.title}</h3>
                                    <p className="text-[14px] leading-relaxed" style={{ color: `${PALETTE.primaryForeground}99` }}>{s.copy}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FIVE SIGNALS */}
            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="max-w-lg mb-14 lum-reveal">
                    <span className="lum-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: PALETTE.primary }}>
                        The five signals
                    </span>
                    <h2 className="lum-display text-3xl lg:text-4xl mt-3 font-medium leading-tight">
                        Everything your face is already telling you.
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed" style={{ color: `${PALETTE.foreground}99` }}>
                        Every scan scores these independently, so your plan targets what's
                        actually happening — not a guess.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {signals.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.name}
                                className="lum-reveal rounded-2xl p-5 border hover:shadow-[0_20px_40px_-25px_rgba(107,58,82,0.4)] transition-shadow"
                                style={{ backgroundColor: PALETTE.card, borderColor: PALETTE.border, animationDelay: `${i * 80}ms` }}
                            >
                                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${PALETTE.primary}1A` }}>
                                    <Icon size={16} style={{ color: PALETTE.primary }} />
                                </div>
                                <h3 className="font-semibold text-[14px] mb-1.5">{s.name}</h3>
                                <p className="text-[12.5px] leading-relaxed" style={{ color: `${PALETTE.foreground}8C` }}>{s.copy}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SCREENSHOT 2 — results dashboard */}
            <section className="py-24" style={{ backgroundColor: PALETTE.secondary }}>
                <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="lum-reveal order-2 lg:order-1">
                        <BrowserFrame label="lumina.app/results">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div className="relative h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData} outerRadius="72%">
                                            <PolarGrid stroke={PALETTE.grid} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: PALETTE.foreground, fontFamily: "Inter" }} />
                                            <Radar dataKey="value" stroke={PALETTE.primary} fill={PALETTE.accent} fillOpacity={0.4} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="flex flex-col items-center rounded-full w-[76px] h-[76px] justify-center border" style={{ backgroundColor: `${PALETTE.background}E6`, borderColor: PALETTE.border }}>
                                            <span className="lum-mono text-2xl font-medium leading-none">82</span>
                                            <span className="lum-mono text-[8px] uppercase tracking-[0.08em]" style={{ color: `${PALETTE.foreground}73` }}>Score</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-4">
                                    <div>
                                        <span className="lum-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: `${PALETTE.foreground}73` }}>Top concerns</span>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {["Mild acne", "Oily T-zone", "Sun spots"].map((c) => (
                                                <span key={c} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${PALETTE.primary}14`, color: PALETTE.primary }}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="lum-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: `${PALETTE.foreground}73` }}>Matched ingredients</span>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {["Niacinamide", "Salicylic acid", "Ceramides"].map((c) => (
                                                <span key={c} className="text-[11px] px-2.5 py-1 rounded-full font-medium border" style={{ borderColor: PALETTE.border, color: PALETTE.foreground }}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-5 border-t" style={{ borderColor: PALETTE.border }}>
                                {routine.map((r) => (
                                    <div key={r.time}>
                                        <span className="lum-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: PALETTE.primary }}>{r.time} routine</span>
                                        <div className="mt-2 flex flex-col gap-1.5">
                                            {r.items.map((it) => (
                                                <div key={it} className="flex items-center gap-2 text-[12px]">
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${PALETTE.primary}1A` }}>
                                                        <Check size={10} style={{ color: PALETTE.primary }} />
                                                    </div>
                                                    <span style={{ color: `${PALETTE.foreground}CC` }}>{it}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </BrowserFrame>
                    </div>

                    <div className="lum-reveal order-1 lg:order-2" style={{ animationDelay: "100ms" }}>
                        <span className="lum-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: PALETTE.primary }}>
                            Your results
                        </span>
                        <h2 className="lum-display text-3xl lg:text-4xl mt-3 font-medium leading-tight">
                            Not just a score. A plan you can follow.
                        </h2>
                        <p className="mt-4 text-[15px] leading-relaxed max-w-md" style={{ color: `${PALETTE.foreground}99` }}>
                            Every scan ends the same way: your five signal scores, the
                            concerns that matter most, ingredients matched to those
                            concerns, and a routine short enough to actually stick to.
                        </p>
                    </div>
                </div>
            </section>

            {/* SCREENSHOT 3 — weekly tracking */}
            <section className="py-24 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div className="lum-reveal">
                    <span className="lum-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: PALETTE.primary }}>
                        Weekly tracking
                    </span>
                    <h2 className="lum-display text-3xl lg:text-4xl mt-3 font-medium leading-tight">
                        Rescan weekly.
                        <br />
                        Watch the line move.
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed max-w-md" style={{ color: `${PALETTE.foreground}99` }}>
                        One photo a week is enough. Lumina lines up every scan side by
                        side and charts your condition score, so improvement is
                        something you can see, not just hope for.
                    </p>
                </div>

                <div className="lum-reveal" style={{ animationDelay: "150ms" }}>
                    <BrowserFrame label="lumina.app/tracking">
                        <div className="flex items-baseline justify-between mb-4">
                            <span className="lum-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: `${PALETTE.foreground}73` }}>
                                Condition score / 6 weeks
                            </span>
                            <span className="lum-mono text-xl" style={{ color: PALETTE.primary }}>+24</span>
                        </div>
                        <div className="h-[160px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trackingData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trackGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={PALETTE.primary} stopOpacity={0.28} />
                                            <stop offset="100%" stopColor={PALETTE.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: `${PALETTE.foreground}99`, fontFamily: "IBM Plex Mono" }} axisLine={false} tickLine={false} />
                                    <Area type="monotone" dataKey="score" stroke={PALETTE.primary} strokeWidth={2.5} fill="url(#trackGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {/* filmstrip of past scan thumbnails — abstract, not real photos */}
                        <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: PALETTE.border }}>
                            {trackingData.map((t, i) => (
                                <div key={t.week} className="flex-1 flex flex-col items-center gap-1.5">
                                    <div
                                        className="w-full aspect-square rounded-lg"
                                        style={{
                                            background: `radial-gradient(circle at 40% 35%, ${PALETTE.accent}${(35 + i * 8).toString(16)}, transparent 60%), ${PALETTE.secondary}`,
                                            border: `1px solid ${PALETTE.border}`,
                                        }}
                                    />
                                    <span className="lum-mono text-[8px]" style={{ color: `${PALETTE.foreground}66` }}>{t.week}</span>
                                </div>
                            ))}
                        </div>
                    </BrowserFrame>
                </div>
            </section>

            {/* TRUST BAR */}
            <section className="py-10 border-y" style={{ borderColor: PALETTE.border, backgroundColor: PALETTE.secondary }}>
                <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-x-14 gap-y-4 text-center">
                    {[
                        ["12,400+", "scans analyzed"],
                        ["4.8 / 5", "average rating"],
                        ["5", "signals per scan"],
                        ["6 wks", "avg. to visible change"],
                    ].map(([n, l]) => (
                        <div key={l}>
                            <div className="lum-mono text-xl font-medium" style={{ color: PALETTE.primary }}>{n}</div>
                            <div className="text-[11px] uppercase tracking-[0.06em] mt-1" style={{ color: `${PALETTE.foreground}73` }}>{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="py-24 max-w-6xl mx-auto px-6">
                <div className="max-w-lg mb-14 lum-reveal">
                    <span className="lum-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: PALETTE.primary }}>
                        From early users
                    </span>
                    <h2 className="lum-display text-3xl lg:text-4xl mt-3 font-medium leading-tight">
                        What changed, in their words.
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    {testimonials.map((t, i) => (
                        <div key={t.initials} className="lum-reveal rounded-2xl p-6 border" style={{ backgroundColor: PALETTE.card, borderColor: PALETTE.border, animationDelay: `${i * 90}ms` }}>
                            <div className="flex gap-0.5 mb-4">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={13} fill={PALETTE.accent} stroke="none" />
                                ))}
                            </div>
                            <p className="text-[14px] leading-relaxed" style={{ color: `${PALETTE.foreground}D9` }}>“{t.quote}”</p>
                            <div className="flex items-center gap-2.5 mt-5">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: PALETTE.secondary, color: PALETTE.primary }}>
                                    {t.initials}
                                </div>
                                <div>
                                    <div className="text-[12.5px] font-semibold">{t.name}</div>
                                    <div className="lum-mono text-[10px]" style={{ color: `${PALETTE.foreground}66` }}>{t.note}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-28 text-center" style={{ backgroundColor: PALETTE.primary, color: PALETTE.primaryForeground }}>
                <div className="max-w-xl mx-auto px-6 lum-reveal">
                    <h2 className="lum-display text-4xl lg:text-5xl font-medium leading-tight">
                        Start with one photo.
                    </h2>
                    <p className="mt-4 text-[15px]" style={{ color: `${PALETTE.primaryForeground}99` }}>
                        Your first scan is free. See where your skin stands today.
                    </p>
                    <button
                        onClick={onRegisterClick}
                        className="group mt-8 px-8 py-3.5 rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                        style={{ backgroundColor: PALETTE.primaryForeground, color: PALETTE.primary }}
                    >
                        Analyze my skin
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-10 text-center border-t" style={{ borderColor: PALETTE.border }}>
                <span className="lum-display text-[15px]" style={{ color: `${PALETTE.foreground}B3` }}>Lumina</span>
                <p className="lum-mono text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: `${PALETTE.foreground}59` }}>
                    AI skin analysis, plainly read
                </p>
            </footer>
        </div>
    );
}