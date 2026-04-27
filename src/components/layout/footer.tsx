import Link from "next/link";
import { Globe, Video, Camera, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-16 pb-8 border-t border-white/10">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4">
          <h3 className="font-serif text-2xl font-bold tracking-wider text-accent">Kingdom Deliverance</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            A branch of Kingdom Temple led by Bishop Climate Wiseman. Inspiring faith, empowering lives, and advancing the Kingdom of God.
          </p>
          <div className="flex space-x-4 pt-2">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <Globe className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <Video className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-primary transition-colors">
                <Camera className="w-5 h-5" />
              </Link>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-lg mb-4 text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
            <li><Link href="/ministries" className="hover:text-accent transition-colors">Ministries</Link></li>
            <li><Link href="/sermons" className="hover:text-accent transition-colors">Latest Sermons</Link></li>
            <li><Link href="/events" className="hover:text-accent transition-colors">Upcoming Events</Link></li>
            <li><Link href="/gallery" className="hover:text-accent transition-colors">Gallery</Link></li>
            <li><Link href="/live" className="hover:text-accent transition-colors">Watch Live</Link></li>
            <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            <li><Link href="/donations" className="hover:text-accent transition-colors">Give Online</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4 text-white">Contact Us</h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <span>123 Deliverance Way, Kampala, Uganda</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-accent shrink-0" />
              <span>+256 123 456 789</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-accent shrink-0" />
              <span>info@kingdomdeliverance.org</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-4 text-white">Service Times</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex justify-between border-b border-white/10 pb-2">
              <span>Sunday Service</span>
              <span className="text-accent">9:00 AM - 12:00 PM</span>
            </li>
            <li className="flex justify-between border-b border-white/10 pb-2">
              <span>Wednesday Bible Study</span>
              <span className="text-accent">6:00 PM - 8:00 PM</span>
            </li>
            <li className="flex justify-between pb-2">
              <span>Friday Prayer</span>
              <span className="text-accent">6:00 PM - 8:00 PM</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="container text-center text-sm text-white/50 border-t border-white/10 pt-8">
        &copy; {new Date().getFullYear()} Kingdom Deliverance Centre Uganda. All rights reserved.
      </div>
    </footer>
  );
}
