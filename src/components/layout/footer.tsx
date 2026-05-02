import Link from "next/link";
import { MapPin, Mail, Phone, Heart, ArrowRight } from "lucide-react";
import { IconFacebook, IconInstagram, IconYoutube } from "@/components/icons/social-inline";

const socialFacebook = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "#";
const socialInstagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "#";
const socialYoutube = process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "#";

export function Footer() {
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
            <div className="flex gap-3">
              {[
                { href: socialFacebook, icon: <IconFacebook className="w-4 h-4" />, label: "Facebook" },
                { href: socialInstagram, icon: <IconInstagram className="w-4 h-4" />, label: "Instagram" },
                { href: socialYoutube, icon: <IconYoutube className="w-4 h-4" />, label: "YouTube" },
              ].map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:border-accent hover:text-accent hover:bg-accent/10 transition-all duration-200"
                >
                  {s.icon}
                </Link>
              ))}
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
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
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
                  Kingdom Deliverance Centre Uganda, Kampala
                </a>
                <a href="tel:+256700000000" className="flex items-center gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200">
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  +256 700 000 000
                </a>
                <a href="mailto:info@kdcuganda.org" className="flex items-center gap-3 text-sm text-white/55 hover:text-accent transition-colors duration-200">
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  info@kdcuganda.org
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-accent">Service Times</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { day: "Sunday", time: "10:00 AM Onwards" },
                  { day: "Wednesday", time: "6:00 PM – 10:00 PM" },
                  { day: "Friday", time: "6:00 PM – 10:00 PM" },
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
          <p>&copy; {new Date().getFullYear()} Kingdom Deliverance Centre Uganda. All rights reserved.</p>
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
