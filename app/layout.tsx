import './globals.css';
import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const display = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'AI Adoption Audit — How AI-ready is your business?',
  description:
    'Analyze your website in minutes. Discover the AI and automation systems your business already uses, what you are missing, and which solutions could help you compete in the next generation of local business.',
  openGraph: {
    title: 'AI Adoption Audit — How AI-ready is your business?',
    description:
      'Get a personalized AI Adoption & Opportunity Audit for your business website. Free, no credit card required.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Adoption Audit',
    description:
      'See how AI-ready your business is — and discover the AI opportunities you are missing.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
