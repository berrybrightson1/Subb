'use client';

import { Bell, Calculator, Ghost, Shield, TrendingUp, Zap } from 'lucide-react';

const CARDS = [
    {
        id: 'calc',
        size: 'large',
        bg: 'bg-mint',
        title: 'Subb Calc',
        description:
            'Instantly calculate your real monthly cost and push the result straight into a new subscription — no mental math needed.',
        icon: Calculator,
        iconColor: 'text-[#065f46]',
        iconBg: 'bg-[#065f46]/10',
        badge: 'Pro',
        visual: <CalcVisual />,
    },
    {
        id: 'trial',
        size: 'small',
        bg: 'bg-surface-soft',
        title: 'Trial Kill Switch',
        description: 'Get urgent alerts 24 hours before any free trial converts. Cancel before you pay.',
        icon: Bell,
        iconColor: 'text-[#d97706]',
        iconBg: 'bg-[#d97706]/10',
        badge: null,
        visual: null,
    },
    {
        id: 'incognito',
        size: 'small',
        bg: 'bg-lavender',
        title: 'Incognito Mode',
        description: 'Hide all prices and service names behind a biometric lock. Your finances, your privacy.',
        icon: Shield,
        iconColor: 'text-[#6d28d9]',
        iconBg: 'bg-[#6d28d9]/10',
        badge: 'Pro',
        visual: null,
    },
    {
        id: 'ghost',
        size: 'small',
        bg: 'bg-surface-soft',
        title: 'Ghost Sub Detector',
        description: "Spots subscriptions you haven't used in 30+ days — the ones silently draining your account.",
        icon: Ghost,
        iconColor: 'text-[#374151]',
        iconBg: 'bg-[#374151]/10',
        badge: null,
        visual: null,
    },
    {
        id: 'insights',
        size: 'small',
        bg: 'bg-surface-soft',
        title: 'Spend Insights',
        description: 'Donut charts, budget goals, and category breakdowns at a glance.',
        icon: TrendingUp,
        iconColor: 'text-[#7d3cff]',
        iconBg: 'bg-[#7d3cff]/10',
        badge: 'Pro',
        visual: null,
    },
    {
        id: 'alerts',
        size: 'small',
        bg: 'bg-surface-soft',
        title: 'Smart Alerts',
        description: 'Customise your alert window — get notified 1, 3, or 7 days before any renewal hits.',
        icon: Zap,
        iconColor: 'text-[#0284c7]',
        iconBg: 'bg-[#0284c7]/10',
        badge: 'Pro',
        visual: null,
    },
];

export default function BentoGrid() {
    // ...
    // ... leaving this part untouched using start/end line matching properly
}

function BentoCard({
    card,
    className = '',
    large = false,
}: {
    card: (typeof CARDS)[0];
    className?: string;
    large?: boolean;
}) {
    const Icon = card.icon;
    return (
        <article
            className={`group relative overflow-hidden rounded-3xl p-7 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.025] ${card.bg} ${className}`}
        >
            {/* Badge */}
            {card.badge && (
                <span className="absolute right-5 top-5 rounded-full bg-brand-violet/10 px-3 py-1 text-xs font-bold text-brand-violet">
                    {card.badge}
                </span>
            )}

            {/* Icon */}
            <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg}`}
            >
                <Icon size={24} className={card.iconColor} strokeWidth={2} />
            </div>

            <h3 className={`font-display font-extrabold text-text-primary ${large ? 'text-2xl' : 'text-lg'}`}>{card.title}</h3>
            <p className={`mt-2 leading-relaxed text-text-muted ${large ? 'text-base max-w-sm' : 'text-sm'}`}>
                {card.description}
            </p>

            {/* Large card visual */}
            {card.visual && <div className="mt-8">{card.visual}</div>}
        </article>
    );
}

function CalcVisual() {
    const buttons = ['C', '+/-', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
    return (
        <div className="mx-auto max-w-[200px] rounded-2xl bg-white/60 p-4 shadow-inner backdrop-blur-sm dark:bg-black/20">
            <div className="mb-3 rounded-xl bg-white/80 px-4 py-3 text-right dark:bg-black/30">
                <p className="text-xs text-text-muted">Monthly total</p>
                <p className="text-2xl font-black text-text-primary">$43.97</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                {buttons.map((b) => (
                    <button
                        key={b}
                        aria-label={b}
                        className={`rounded-xl py-2.5 text-sm font-bold transition-transform hover:scale-95 ${b === '='
                            ? 'bg-brand-violet text-white col-span-1'
                            : ['÷', '×', '−', '+'].includes(b)
                                ? 'bg-brand-orange/20 text-brand-orange'
                                : ['C', '+/-', '%'].includes(b)
                                    ? 'bg-black/10 text-text-muted'
                                    : 'bg-white/70 text-text-primary dark:bg-black/30'
                            }`}
                    >
                        {b}
                    </button>
                ))}
            </div>
        </div>
    );
}
