
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import SafeAnalytics from '@/components/core/safe-analytics'; // Updated import

export const metadata: Metadata = {
  title: 'Adaptarcade Game Arcade',
  description: 'A collection of fun mini-games!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8828674905853137"
     crossOrigin="anonymous"></script>
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
        <SafeAnalytics /> {/* Use the safe wrapper */}
      </body>
    </html>
  );
}
