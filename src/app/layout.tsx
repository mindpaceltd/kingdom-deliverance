import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
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
    .in('key', ['site_name', 'tagline', 'site_meta_title', 'site_meta_description', 'site_meta_keywords', 'site_icon', 'site_og_image']);

  const s = new Map(settings?.map(i => [i.key, i.value]) || []);

  const siteName = s.get('site_name') || "Kingdom Deliverance Centre Uganda";
  const metaTitle = s.get('site_meta_title') || siteName;
  const metaDesc = s.get('site_meta_description') || "Experience God's love, healing, and deliverance in our vibrant church community in Uganda.";
  const metaKeywords = s.get('site_meta_keywords') || "church Uganda, Kingdom Deliverance Centre, Bishop Climate Wiseman, Christian ministry, deliverance, healing, Kampala church";
  const siteIcon = s.get('site_icon') || "/favicon.ico";
  const siteOgImage = s.get('site_og_image') || "https://images.unsplash.com/photo-1493397212122-2b85dda8106b?q=80&w=2071&auto=format&fit=crop";

  return {
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`
    },
    description: metaDesc,
    keywords: metaKeywords,
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
      images: [
        {
          url: siteOgImage,
          width: 1200,
          height: 630,
          alt: siteName,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: [siteOgImage],
    },
  };
}

import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Toaster } from "sonner";
import { OrganizationSchema } from "@/components/seo/organization-schema";

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
        <OrganizationSchema />
      </head>
      <body className="flex flex-col min-h-screen">
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BDH3RW93YC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BDH3RW93YC');
          `}
        </Script>
        
        {/* Google Analytics G-QC1Z4DBHPW (New Property) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QC1Z4DBHPW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics-new" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-QC1Z4DBHPW');
          `}
        </Script>
        {children}
        <ScrollToTop />
        <Toaster position="top-center" expand={true} richColors />
      </body>
    </html>
  );
}
