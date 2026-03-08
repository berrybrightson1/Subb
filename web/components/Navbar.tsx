'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-bg-main/60 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-text-primary">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-violet text-white">
                        <Sparkles size={16} strokeWidth={2.5} />
                    </span>
                    Subb
                </Link>

                {/* Nav links */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
                    <Link href="#features" className="hover:text-text-primary transition-colors">Features</Link>
                    <Link href="#pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
                    <Link href="#faq" className="hover:text-text-primary transition-colors">FAQ</Link>
                </nav>

                {/* CTA */}
                <Link
                    href="#hero"
                    className="rounded-full bg-brand-violet px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-violet/30 transition-all hover:brightness-110 hover:scale-105"
                >
                    Get Started Free
                </Link>
            </div>
        </header>
    );
}
