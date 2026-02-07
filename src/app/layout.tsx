import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'NeetProgress',
  description: 'Track your NEET syllabus progress and get AI-powered recommendations.',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={poppins.variable}>
      <body className="font-body antialiased">
        <Providers>
            {children}
        </Providers>
      </body>
    </html>
  );
}
