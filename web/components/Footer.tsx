'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';

const LINKS = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Pricing', href: '#' },
    { label: 'Support', href: 'mailto:hello@subb.app' },
];

export default function Footer() {
    return (
        <footer className="bg-bg-main border-t border-white/10 py-12 px-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-violet text-white">
                        <Sparkles size={13} strokeWidth={2.5} />
                    </span>
                    <span className="font-bold text-text-primary">Subb</span>
                </div>

                {/* Links */}
                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    {LINKS.map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            className="text-sm text-text-muted transition-colors hover:text-text-primary"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Copyright */}
                <p className="text-xs text-text-muted">
                    © {new Date().getFullYear()} Subb. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
