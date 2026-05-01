import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { createClient } from '@/lib/supabase/server';
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap"
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'tagline', 'site_meta_title', 'site_meta_description', 'site_icon']);

  const s = new Map(settings?.map(i => [i.key, i.value]) || []);

  const siteName = s.get('site_name') || "Kingdom Deliverance Centre Uganda";
  const metaTitle = s.get('site_meta_title') || siteName;
  const metaDesc = s.get('site_meta_description') || "Experience God's love, healing, and deliverance in our vibrant church community in Uganda.";
  const siteIcon = s.get('site_icon') || "/favicon.ico";

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`
    },
    description: metaDesc,
    icons: {
      icon: siteIcon,
      shortcut: siteIcon,
      apple: siteIcon,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://kdcuganda.org",
      title: metaTitle,
      description: metaDesc,
      siteName: siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}
