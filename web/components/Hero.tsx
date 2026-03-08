'use client';

import { ArrowRight, TrendingDown, Zap } from 'lucide-react';

const STATS = [
    { label: 'Average savings', value: '$340/yr', icon: TrendingDown },
    { label: 'Subscriptions tracked', value: '50K+', icon: Zap },
];

export default function Hero() {
    return (
        <section
            id="hero"
            className="relative overflow-hidden bg-bg-main pb-24 pt-20 text-center md:pt-28"
        >
            {/* Ambient glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-brand-violet/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-6xl px-6">
                {/* Badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-violet/30 bg-brand-violet/10 px-4 py-1.5 text-sm font-medium text-brand-violet">
                    <Zap size={14} />
                    <span>The smarter subscription tracker</span>
                </div>

                {/* Headline + sub — split layout on desktop */}
                <div className="md:flex md:items-center md:gap-16 md:text-left">
                    {/* Left: text */}
                    <div className="flex-1">
                        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text-primary md:text-6xl">
                            Master your{' '}
                            <span className="text-brand-violet">monthly burn.</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-text-muted md:mx-0 md:text-lg">
                            Subb tracks every subscription, fires alerts before trials turn into charges, and
                            surfaces ghost subs draining your budget — all in a beautiful, zero-clutter app.
                        </p>

                        {/* Primary CTA */}
                        <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:items-start">
                            <a
                                href="#"
                                className="group flex items-center gap-2 rounded-full bg-brand-violet px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-brand-violet/30 transition-all hover:brightness-110 hover:scale-105"
                            >
                                Start Free — No Credit Card
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </a>
                            <a
                                href="#features"
                                className="rounded-full border border-text-muted/30 px-7 py-3.5 text-base font-semibold text-text-muted transition-all hover:border-text-primary hover:text-text-primary"
                            >
                                See How It Works
                            </a>
                        </div>

                        {/* Mini stats */}
                        <div className="mt-10 flex flex-wrap gap-6 md:flex-nowrap">
                            {STATS.map(({ label, value, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-bg-surface px-5 py-3 shadow-sm"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
                                        <Icon size={18} />
                                    </span>
                                    <div>
                                        <p className="text-lg font-bold text-text-primary">{value}</p>
                                        <p className="text-xs text-text-muted">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Decorative App Card Preview */}
                    <div className="mt-14 flex-1 md:mt-0">
                        <AppPreviewCard />
                    </div>
                </div>
            </div>
        </section>
    );
}

function AppPreviewCard() {
    const subs = [
        { name: 'Netflix', amount: '$15.99', status: 'active', days: null, color: 'bg-[#e50914]' },
        { name: 'Spotify', amount: '$9.99', status: 'trial', days: '2 days', color: 'bg-[#1DB954]' },
        { name: 'iCloud', amount: '$2.99', status: 'active', days: null, color: 'bg-[#007AFF]' },
        { name: 'Figma', amount: '$15.00', status: 'ghost', days: null, color: 'bg-[#A259FF]' },
    ];

    return (
        <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-bg-surface p-6 shadow-2xl ring-1 ring-black/5">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Monthly Burn</p>
                <span className="rounded-full bg-brand-violet/10 px-3 py-1 text-xs font-bold text-brand-violet">Pro</span>
            </div>
            <p className="mb-6 text-4xl font-extrabold text-text-primary">
                $43.<span className="text-text-muted text-2xl">97</span>
                <span className="ml-1 text-sm font-normal text-text-muted">/mo</span>
            </p>

            {/* Subscription list */}
            <ul className="space-y-3">
                {subs.map((sub) => (
                    <li
                        key={sub.name}
                        className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-bg-main"
                    >
                        <div className="flex items-center gap-3">
                            <span
                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold ${sub.color}`}
                            >
                                {sub.name[0]}
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{sub.name}</p>
                                {sub.status === 'trial' && (
                                    <p className="text-xs text-brand-orange font-medium">⚠ Trial ends in {sub.days}</p>
                                )}
                                {sub.status === 'ghost' && (
                                    <p className="text-xs text-text-muted">Ghost sub detected</p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm font-bold text-text-primary">{sub.amount}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
