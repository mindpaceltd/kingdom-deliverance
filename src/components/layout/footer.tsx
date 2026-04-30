import Link from "next/link";
import { MapPin, Mail, Phone, Heart, ArrowRight, Globe, ChevronRight } from "lucide-react";
import { IconFacebook, IconInstagram, IconYoutube } from "@/components/icons/social-inline";

const socialFacebook = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "#";
const socialInstagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "#";
const socialYoutube = process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "#";

export function Footer() {
  return (
    <footer className="bg-[#0a121f] text-white pt-24 border-t border-white/5">
      {/* Main Footer Content */}
      <div className="container px-4 max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          
          {/* Column 1: Brand & Identity */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-[#eab308] flex items-center justify-center shadow-2xl shadow-[#eab308]/20 group-hover:scale-105 transition-transform duration-500">
                  <span className="text-[#0a121f] font-black text-2xl">K</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white leading-tight">Kingdom <span className="text-[#eab308]">Deliverance</span></h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Centre Uganda</p>
                </div>
              </Link>
              <p className="text-white/50 text-lg leading-relaxed max-w-md font-medium italic">
                "Anointed for service, positioned for impact. Join us as we bring the message of deliverance and restoration to a generation."
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {[
                { href: socialFacebook, icon: <IconFacebook className="w-5 h-5" />, name: "Facebook" },
                { href: socialInstagram, icon: <IconInstagram className="w-5 h-5" />, name: "Instagram" },
                { href: socialYoutube, icon: <IconYoutube className="w-5 h-5" />, name: "YouTube" },
                { href: "#", icon: <Globe className="w-5 h-5" />, name: "Twitter" },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-[#eab308] hover:text-[#0a121f] hover:border-[#eab308] transition-all duration-500 shadow-sm"
                  aria-label={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="lg:col-span-3 space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308] flex items-center gap-3">
              <div className="w-6 h-px bg-[#eab308]" /> Navigation
            </h4>
            <div className="grid grid-cols-1 gap-y-4">
              {[
                { name: "About Story", href: "/about" },
                { name: "Ministries", href: "/ministries" },
                { name: "Sermon Archive", href: "/sermons" },
                { name: "Join Events", href: "/events" },
                { name: "Our Gallery", href: "/gallery" },
                { name: "Watch Live", href: "/live" },
                { name: "Donations", href: "/donations" },
                { name: "Contact Us", href: "/contact" },
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/50 hover:text-[#eab308] text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#eab308] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Contact & Logistics */}
          <div className="lg:col-span-4 space-y-10">
            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eab308] flex items-center gap-3">
                <div className="w-6 h-px bg-[#eab308]" /> Location
              </h4>
              <div className="space-y-6">
                <a
                  href="https://maps.app.goo.gl/RrBd8tDxEDky8D6N7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 text-white/50 hover:text-white transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#eab308] group-hover:text-[#0a121f] transition-all">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium leading-relaxed">
                    Kingdom Deliverance Centre Uganda, <br />
                    Kampala, Uganda
                  </span>
                </a>
                <a href="tel:+256700000000" className="flex items-center gap-4 text-white/50 hover:text-white transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#eab308] group-hover:text-[#0a121f] transition-all">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold tracking-widest">+256 700 000 000</span>
                </a>
              </div>
            </div>

            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308] opacity-5 blur-3xl -mr-16 -mt-16" />
              <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#eab308] mb-6">Service Schedule</h5>
              <div className="space-y-4">
                {[
                  { day: "Sunday", time: "9:00 AM – 12:00 PM" },
                  { day: "Wednesday", time: "6:30 PM (Bible Study)" },
                ].map((s) => (
                  <div key={s.day} className="flex items-center justify-between text-xs pb-3 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-white/40 font-black uppercase tracking-widest">{s.day}</span>
                    <span className="text-white font-bold">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Credit */}
      <div className="border-t border-white/5 py-10 bg-black/20">
        <div className="container px-4 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            &copy; {new Date().getFullYear()} Kingdom Deliverance Centre Uganda.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            Anointed for <Heart className="w-3.5 h-3.5 text-[#eab308] fill-current mx-1 animate-pulse" /> the Kingdom
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
            <Link href="#" className="hover:text-[#eab308] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#eab308] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
