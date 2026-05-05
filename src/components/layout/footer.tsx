import Link from "next/link";
import { MapPin, Mail, Phone, Heart, ArrowRight, Globe } from "lucide-react";
import { IconFacebook, IconInstagram, IconYoutube, IconTwitter, IconLinkedin, IconTiktok } from "@/components/icons/social-inline";
import { createClient } from "@/lib/supabase/server";

const platformIcons: Record<string, any> = {
  facebook: <IconFacebook className="w-4 h-4" />,
  instagram: <IconInstagram className="w-4 h-4" />,
  youtube: <IconYoutube className="w-4 h-4" />,
  twitter: <IconTwitter className="w-4 h-4" />,
  x: <IconTwitter className="w-4 h-4" />,
  linkedin: <IconLinkedin className="w-4 h-4" />,
  tiktok: <IconTiktok className="w-4 h-4" />,
};

export async function Footer() {
  const supabase = createClient();
  const { data: settings } = await supabase.from('site_settings').select('key, value');
  const settingsMap = Object.fromEntries(settings?.map(s => [s.key, s.value]) || []);

  const dynamicSocialLinks = settingsMap.social_links_json ? JSON.parse(settingsMap.social_links_json) : [];
  const additionalPhones = settingsMap.contact_phones_json ? JSON.parse(settingsMap.contact_phones_json) : [];

  // Fallback to env or defaults if no dynamic links
  const socialFacebook = settingsMap.facebook_url || process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "#";
  const socialInstagram = settingsMap.instagram_url || process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "#";
  const socialYoutube = settingsMap.youtube_url || process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "#";

  return (
    <footer className="bg-[#0a1628] text-white">
      {/* Main Footer */}
      <div className="container px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand col */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-lg leading-none">K</span>
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-white leading-tight">Kingdom Deliverance</p>
                <p className="text-xs text-white/50 tracking-widest uppercase">Centre Uganda</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              A branch of Kingdom Temple led by Bishop Climate Wiseman — committed to worship, biblical teaching, and transforming lives through Jesus Christ.
            </p>
            {/* Socials */}
            <div className="flex flex-wrap gap-3">
              {/* Traditional Socials */}
              {[
                { href: socialFacebook, icon: <IconFacebook className="w-4 h-4" />, label: "Facebook" },
                { href: socialInstagram, icon: <IconInstagram className="w-4 h-4" />, label: "Instagram" },
                { href: socialYoutube, icon: <IconYoutube className="w-4 h-4" />, label: "YouTube" },
              ].filter(s => s.href !== "#").map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:border-accent hover:text-accent hover:bg-accent/10 transition-all duration-200"
                >
                  {s.icon}
                </Link>
              ))}

              {/* Dynamic Socials */}
              {dynamicSocialLinks.map((s: any, idx: number) => {
                const platformKey = s.platform.toLowerCase();
                const icon = platformIcons[platformKey] || <Globe className="w-4 h-4" />;
                return (
                  <Link
                    key={`dynamic-${idx}`}
                    href={s.url}
                    aria-label={s.platform}
                    target="_blank"
                    className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:border-accent hover:text-accent hover:bg-accent/10 transition-all duration-200"
                  >
                    {icon}
                  </Link>
                );
              })}
            </div>
            {/* Privacy & Terms below socials */}
            <div className="flex items-center gap-4 pt-1">
              <Link href="/privacy" className="text-xs text-white/40 hover:text-accent transition-colors duration-200">
                Privacy Policy
              </Link>
              <span className="w-px h-3 bg-white/15" />
              <Link href="/terms" className="text-xs text-white/40 hover:text-accent transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Quick Links</p>
            <ul className="space-y-2.5">
              {[
                { name: "About Us", href: "/about" },
                { name: "Ministries", href: "/ministries" },
                { name: "Sermons", href: "/sermons" },
                { name: "Events", href: "/events" },
                { name: "Gallery", href: "/gallery" },
                { name: "Watch Live", href: "/live" },
                { name: "Give Online", href: "/donations" },
                { name: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 hover:text-accent transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Service Times */}
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Contact</p>
              <div className="space-y-3">
                <a
                  href="https://maps.app.goo.gl/RrBd8tDxEDky8D6N7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200 group"
                >
                  <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  {settingsMap.address || "Kingdom Deliverance Centre Uganda, Kampala"}
                </a>
                
                {/* Main Phone */}
                <a href={`tel:${settingsMap.contact_phone || "+256700000000"}`} className="flex items-center gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200">
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  {settingsMap.contact_phone || "+256 700 000 000"}
                </a>

                {/* Additional Phones */}
                {additionalPhones.map((phone: string, idx: number) => (
                  <a key={`phone-${idx}`} href={`tel:${phone}`} className="flex items-center gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200">
                    <Phone className="w-4 h-4 text-accent shrink-0" />
                    {phone}
                  </a>
                ))}

                <a href={`mailto:${settingsMap.contact_email || "info@kdcuganda.org"}`} className="flex items-center gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200">
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  {settingsMap.contact_email || "info@kdcuganda.org"}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Service Times</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { day: "Sunday", time: "10:00 AM (EAT)" },
                  { day: "Wednesday", time: "6:00 PM (EAT)" },
                  { day: "Friday", time: "6:00 PM (EAT)" },
                ].map((s) => (
                  <div key={s.day} className="flex items-center justify-between text-sm border-b border-white/8 pb-2">
                    <span className="text-white/70 font-medium">{s.day}</span>
                    <span className="text-accent text-xs font-semibold">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8 py-5">
        <div className="container px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <p>&copy; {new Date().getFullYear()} {settingsMap.site_name || "Kingdom Deliverance Centre Uganda"}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-accent mx-0.5" fill="currentColor" /> for the Kingdom
            </p>
            <span className="w-px h-3 bg-white/10 hidden sm:block" />
            <Link href="https://kdcuganda.org/" className="hover:text-accent transition-colors duration-200">
              Developed by bclimax technologies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
