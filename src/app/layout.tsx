import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Spend Audit — Find Hidden Savings on AI Tools',
  description:
    'Free instant audit for Cursor, ChatGPT, Claude, Copilot & more. Find out if you are overpaying for AI tools with actionable recommendations.',
  keywords: [
    'AI spend',
    'Cursor pricing',
    'ChatGPT pricing',
    'Claude pricing',
    'Copilot pricing',
    'AI cost optimization',
    'startup tools',
    'SaaS savings',
  ],
  authors: [{ name: 'AI Spend Audit' }],
  openGraph: {
    title: 'AI Spend Audit — Find Hidden Savings on AI Tools',
    description:
      'Free instant audit: Are you overpaying for Cursor, ChatGPT, Claude, or Copilot?',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Spend Audit — Find Hidden Savings on AI Tools',
    description:
      'Free instant audit: Are you overpaying for Cursor, ChatGPT, Claude, or Copilot?',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
