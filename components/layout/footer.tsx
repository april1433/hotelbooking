"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Star } from "lucide-react";
import { APP_NAME } from "@/constants";
import { createClient } from "@/lib/supabase/client";

const footerLinks = {
  Hotel: [
    { label: "Our Rooms", href: "/rooms" },
    { label: "Gallery", href: "/gallery" },
  ],
  "Guest Services": [
    { label: "Book a Room", href: "/booking" },
    { label: "Special Offers", href: "/offers" },
    { label: "Events", href: "/events" },
    { label: "FAQs", href: "/faqs" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/privacy#cookies" },
    { label: "Cancellation Policy", href: "/terms#cancellation" },
  ],
};

export function Footer() {
  const [brandName, setBrandName] = useState("Grand Azure");
  const [supportEmail, setSupportEmail] = useState("reservations@grandazure.com");
  const [supportPhone, setSupportPhone] = useState("+63 2 8123 4567");
  const [supportAddress, setSupportAddress] = useState("1234 Azure Boulevard, BGC, Taguig City, Metro Manila, Philippines");

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient() as any;
      try {
        const { data } = await supabase.from("settings").select("*");
        if (data && data.length > 0) {
          data.forEach((s: any) => {
            if (s.key === "brand_name") setBrandName(s.value);
            if (s.key === "support_email") setSupportEmail(s.value);
            if (s.key === "support_phone") setSupportPhone(s.value);
            if (s.key === "support_address") setSupportAddress(s.value);
          });
        }
      } catch (err) {
        console.error("Failed to load settings in footer:", err);
      }
    }
    loadSettings();
  }, []);

  return (
    <footer className="bg-navy-950 text-cream-200">
      {/* Gold divider */}
      <div className="gold-divider" />

      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                <span className="text-gold-400 font-display font-bold text-xl">{brandName[0] || "G"}</span>
              </div>
              <div>
                <div className="text-white font-display font-semibold text-lg leading-none">{brandName}</div>
                <div className="text-gold-400/70 text-[10px] tracking-widest uppercase font-sans">{brandName.includes("Azure") ? "Hotel & Suites" : "Property"}</div>
              </div>
            </Link>
            <p className="text-cream-300/60 text-sm leading-relaxed mb-6 max-w-xs">
              Experience unparalleled luxury and impeccable service. Your extraordinary journey begins here.
            </p>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
              ))}
              <span className="text-xs text-cream-300/50 ml-2">5-Star Luxury Hotel</span>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cream-300/60 hover:text-gold-400 hover:border-gold-400/30 hover:bg-gold-400/10 transition-all duration-200" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cream-300/60 hover:text-gold-400 hover:border-gold-400/30 hover:bg-gold-400/10 transition-all duration-200" aria-label="Instagram">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cream-300/60 hover:text-gold-400 hover:border-gold-400/30 hover:bg-gold-400/10 transition-all duration-200" aria-label="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cream-300/60 hover:text-gold-400 hover:border-gold-400/30 hover:bg-gold-400/10 transition-all duration-200" aria-label="Youtube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.021 0 12 0 12s0 3.979.502 5.837a3.001 3.001 0 0 0 2.11 2.107C4.495 20.455 12 20.455 12 20.455s7.505 0 9.388-.511a3.002 3.002 0 0 0 2.11-2.107C24 15.979 24 12 24 12s0-3.979-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-5 tracking-wide">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}
                      className="text-sm text-cream-300/50 hover:text-gold-400 transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact bar */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: MapPin, text: supportAddress },
              { icon: Phone, text: supportPhone },
              { icon: Mail, text: supportEmail },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 text-sm text-cream-300/50">
                <Icon className="h-4 w-4 text-gold-400 mt-0.5 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream-300/40">
          <p>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <p>Designed with ♥ for exceptional hospitality</p>
        </div>
      </div>
    </footer>
  );
}
