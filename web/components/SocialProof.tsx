'use client';

const TESTIMONIALS = [
    {
        quote:
            "I found 4 subscriptions I completely forgot about. Subb paid for itself in the first week.",
        name: 'Mariam A.',
        handle: '@mariam_dev',
        avatar: 'M',
        color: 'bg-[#7d3cff]',
    },
    {
        quote:
            "The trial Kill Switch alone is worth it. No more surprise charges on my statement.",
        name: 'James T.',
        handle: '@jtechlife',
        avatar: 'J',
        color: 'bg-[#f58a1f]',
    },
    {
        quote:
            "Finally an app that makes me \*feel\* in control of money. The design is genuinely beautiful.",
        name: 'Sofía N.',
        handle: '@sofiaux',
        avatar: 'S',
        color: 'bg-[#ff0028]',
    },
];

export default function SocialProof() {
    return (
        <section className="bg-bg-surface py-24 px-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-14 text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-violet">
                        Loved by users
                    </p>
                    <h2 className="text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
                        Real stories, real savings.
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {TESTIMONIALS.map((t) => (
                        <div
                            key={t.handle}
                            className="group rounded-3xl border border-white/10 bg-bg-main p-6 shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:scale-[1.02]"
                        >
                            <p className="mb-6 text-sm leading-relaxed text-text-muted">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <span
                                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}
                                >
                                    {t.avatar}
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                                    <p className="text-xs text-text-muted">{t.handle}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
