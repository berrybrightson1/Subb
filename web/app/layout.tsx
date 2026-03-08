import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Subb — Master Your Monthly Burn',
  description:
    'Subb is the smart subscription tracker that alerts you before trials end, flags ghost subs, and gives you full financial clarity — all in one beautiful app.',
  keywords: ['subscription manager', 'trial tracker', 'personal finance', 'Subb'],
  openGraph: {
    title: 'Subb — Master Your Monthly Burn',
    description: 'Take control of every subscription. Start free.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
