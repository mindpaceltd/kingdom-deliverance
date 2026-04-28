import Link from "next/link";
import { MapPin, Mail, Phone, Clock, Heart, ArrowRight } from "lucide-react";
import { IconFacebook, IconInstagram, IconYoutube } from "@/components/icons/social-inline";
import { Button } from "@/components/ui/button";

const socialFacebook = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "#";
const socialInstagram = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "#";
const socialYoutube = process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "#";

export function Footer() {
  return (
    <footer className="relative mt-20 gradient-primary text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px]" />
      </div>
      
      {/* Newsletter Section */}
      <div className="relative border-b border-white/10 py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent">
              <Heart className="w-4 h-4" />
              Stay Connected
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-serif">
              Join Our Church Family
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Get the latest updates on services, events, and inspiring messages delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <Button className="gradient-accent text-primary font-semibold hover:scale-105 transition-all duration-300">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Church Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-accent rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-xl">K</span>
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-accent">Kingdom Deliverance</h3>
                  <p className="text-white/70 text-sm">Centre Uganda</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed max-w-md">
                A branch of Kingdom Temple led by Bishop Climate Wiseman. We are a family of believers 
                committed to passionate worship, deep biblical teaching, and transforming our community 
                through the love of Jesus Christ.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <Link
                  href={socialFacebook}
                  className="group w-12 h-12 rounded-full glass-morphism flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="Facebook"
                >
                  <IconFacebook className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </Link>
                <Link
                  href={socialInstagram}
                  className="group w-12 h-12 rounded-full glass-morphism flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="Instagram"
                >
                  <IconInstagram className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </Link>
                <Link
                  href={socialYoutube}
                  className="group w-12 h-12 rounded-full glass-morphism flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label="YouTube"
                >
                  <IconYoutube className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </Link>
              </div>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-lg mb-6 text-accent flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "About Us", href: "/about" },
                  { name: "Ministries", href: "/ministries" },
                  { name: "Latest Sermons", href: "/sermons" },
                  { name: "Upcoming Events", href: "/events" },
                  { name: "Gallery", href: "/gallery" },
                  { name: "Watch Live", href: "/live" },
                  { name: "Contact", href: "/contact" },
                  { name: "Give Online", href: "/donations" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href} 
                      className="text-white/70 hover:text-accent hover:translate-x-2 transition-all duration-300 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-accent/50 rounded-full group-hover:bg-accent transition-colors duration-300" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Service Times */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div>
                <h4 className="font-semibold text-lg mb-6 text-accent flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Contact Us
                </h4>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start space-x-3 group">
                    <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80">123 Deliverance Way, Kampala, Uganda</span>
                  </li>
                  <li className="flex items-center space-x-3 group">
                    <Phone className="w-5 h-5 text-accent shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80">+256 123 456 789</span>
                  </li>
                  <li className="flex items-center space-x-3 group">
                    <Mail className="w-5 h-5 text-accent shrink-0 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80">info@kingdomdeliverance.org</span>
                  </li>
                </ul>
              </div>

              {/* Service Times */}
              <div>
                <h4 className="font-semibold text-lg mb-6 text-accent flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Service Times
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="glass-morphism rounded-lg p-3 hover:bg-white/5 transition-colors duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90 font-medium">Sunday Service</span>
                      <span className="text-accent font-semibold">9:00 AM - 12:00 PM</span>
                    </div>
                  </div>
                  <div className="glass-morphism rounded-lg p-3 hover:bg-white/5 transition-colors duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90 font-medium">Bible Study</span>
                      <span className="text-accent font-semibold">Wed 6:00 PM</span>
                    </div>
                  </div>
                  <div className="glass-morphism rounded-lg p-3 hover:bg-white/5 transition-colors duration-300">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90 font-medium">Prayer Meeting</span>
                      <span className="text-accent font-semibold">Fri 6:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative border-t border-white/10 py-6">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
            <p>&copy; {new Date().getFullYear()} Kingdom Deliverance Centre Uganda. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-accent transition-colors duration-300">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-accent transition-colors duration-300">Terms of Service</Link>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-accent" /> for the Kingdom
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
