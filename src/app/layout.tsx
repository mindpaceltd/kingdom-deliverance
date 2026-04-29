import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Kingdom Deliverance Centre Uganda",
    template: "%s | Kingdom Deliverance Centre Uganda"
  },
  description: "A branch of Kingdom Temple led by Bishop Climate Wiseman. Experience God's love, healing, and deliverance in our vibrant church community in Uganda.",
  keywords: ["church", "Uganda", "Kingdom Deliverance", "Bishop Climate Wiseman", "worship", "sermons", "faith", "community"],
  authors: [{ name: "Kingdom Deliverance Centre Uganda" }],
  creator: "Kingdom Deliverance Centre Uganda",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://kingdomdeliverance.org",
    title: "Kingdom Deliverance Centre Uganda",
    description: "Experience God's love, healing, and deliverance in our vibrant church community.",
    siteName: "Kingdom Deliverance Centre Uganda",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingdom Deliverance Centre Uganda",
    description: "Experience God's love, healing, and deliverance in our vibrant church community.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
