import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import { createClient } from '@/lib/supabase/server';
import { getOrgOgImageUrl, getSiteName } from '@/lib/seo/site-branding';
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
  const defaultSiteName = "Kingdom Deliverance Centre Uganda";
  const metaTitle = defaultSiteName;
  const metaDesc =
    "Kingdom Deliverance Centre Uganda (KDC) — Pentecostal church in Kampala led by Bishop Climate Wiseman. Sunday worship, live sermons, healing, deliverance, and ministry programs.";
  const metaKeywords =
    "church Uganda, Kampala church, Pentecostal church Uganda, Kingdom Deliverance Centre, KDC Uganda, Bishop Climate Wiseman, deliverance ministry Uganda, healing church Kampala, live church service Uganda, Christian church Kosovo Lungujja, worship Kampala, Bible study Uganda, Fire Service prayer";
  const siteIcon = "/favicon.ico";
  const siteOgImage = await getOrgOgImageUrl();
  const siteName = await getSiteName();

  try {
  const supabase = createClient();
  
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'tagline', 'site_meta_title', 'site_meta_description', 'site_meta_keywords', 'site_icon', 'site_og_image']);

  const s = new Map(settings?.map(i => [i.key, i.value]) || []);

  const resolvedSiteName = s.get('site_name') || siteName || defaultSiteName;
  const resolvedMetaTitle = s.get('site_meta_title') || resolvedSiteName;
  const resolvedMetaDesc = s.get('site_meta_description') || metaDesc;
  const resolvedMetaKeywords = s.get('site_meta_keywords') || metaKeywords;
  const resolvedSiteIcon = s.get('site_icon') || siteIcon;
  const resolvedSiteOgImage = s.get('site_og_image') || siteOgImage;

  return {
    metadataBase: new URL('https://kdcuganda.org'),
    title: {
      default: resolvedMetaTitle,
      template: `%s | ${resolvedSiteName}`
    },
    description: resolvedMetaDesc,
    keywords: resolvedMetaKeywords,
    icons: {
      icon: resolvedSiteIcon,
      shortcut: resolvedSiteIcon,
      apple: resolvedSiteIcon,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://kdcuganda.org",
      title: resolvedMetaTitle,
      description: resolvedMetaDesc,
      siteName: resolvedSiteName,
      images: [
        {
          url: resolvedSiteOgImage,
          width: 1200,
          height: 630,
          alt: resolvedSiteName,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedMetaTitle,
      description: resolvedMetaDesc,
      images: [resolvedSiteOgImage],
    },
  };
  } catch (err) {
    console.error('[generateMetadata] Failed to load site settings:', err)
    return {
      metadataBase: new URL('https://kdcuganda.org'),
      title: { default: metaTitle, template: `%s | ${siteName || defaultSiteName}` },
      description: metaDesc,
      keywords: metaKeywords,
      icons: { icon: siteIcon, shortcut: siteIcon, apple: siteIcon },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://kdcuganda.org",
        title: metaTitle,
        description: metaDesc,
        siteName: siteName || defaultSiteName,
        images: [{ url: siteOgImage, width: 1200, height: 630, alt: siteName || defaultSiteName }],
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDesc,
        images: [siteOgImage],
      },
    }
  }
}

import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { Toaster } from "sonner";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { WebsiteSchema } from "@/components/seo/website-schema";

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
      <body className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden relative">
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
        <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden relative">
          <OrganizationSchema />
          <WebsiteSchema />
          {children}
        </div>
        <ScrollToTop />
        <Toaster position="top-center" expand={true} richColors />
      </body>
    </html>
  );
}
