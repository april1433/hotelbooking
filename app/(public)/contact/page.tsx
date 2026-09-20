"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Button, Input, Label, Textarea, Card, CardContent } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [supportAddress, setSupportAddress] = useState("1234 Azure Boulevard, BGC, Taguig City, Philippines");
  const [supportPhone, setSupportPhone] = useState("+63 2 8123 4567");
  const [supportEmail, setSupportEmail] = useState("reservations@grandazure.com");

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient() as any;
      try {
        const { data } = await supabase.from("settings").select("*");
        if (data && data.length > 0) {
          data.forEach((s: any) => {
            if (s.key === "support_address") setSupportAddress(s.value);
            if (s.key === "support_phone") setSupportPhone(s.value);
            if (s.key === "support_email") setSupportEmail(s.value);
          });
        }
      } catch (err) {
        console.error("Failed to load settings in contact page:", err);
      }
    }
    loadSettings();
  }, []);

  function handleMessageSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success("Thank you! Your message has been sent to our concierge desk.");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="bg-cream-50 dark:bg-charcoal-950 min-h-screen">
      
      {/* Subpage Banner */}
      <section className="relative h-[35vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-xs" />
        <div className="container relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Contact Concierge</h1>
          <p className="text-xs uppercase tracking-widest text-gold-400 mt-3 font-semibold font-mono">Get in Touch</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Info Side */}
          <div className="space-y-12">
            <div>
              <span className="text-gold-500 uppercase tracking-widest text-xs font-semibold block mb-2">Inquiries</span>
              <h2 className="text-3xl font-display font-bold text-foreground">We Are Ready to Serve You</h2>
              <p className="text-muted-foreground text-sm font-light leading-relaxed mt-4">
                Have questions regarding suite features, private restaurant bookings, or corporate event spaces? Leave a message or reach us directly.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: MapPin, label: "Estate Address", detail: supportAddress },
                { icon: Phone, label: "Reservation Desk", detail: supportPhone },
                { icon: Mail, label: "Support Mail", detail: supportEmail },
                { icon: Clock, label: "Concierge Availability", detail: "Open 24 hours / 7 days a week" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-navy-900/50 flex items-center justify-center text-gold-600 dark:text-gold-400 border border-gold-200/20 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</h4>
                      <p className="text-sm font-medium text-foreground mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Side */}
          <Card className="border border-border/40 bg-white/70 dark:bg-charcoal-900/70 backdrop-blur-md p-8 rounded-2xl shadow-luxury-lg">
            <CardContent className="p-0">
              <form onSubmit={handleMessageSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                    <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs uppercase tracking-wider text-muted-foreground">Subject</Label>
                  <Input id="subject" type="text" placeholder="Reservation Inquiry" value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs uppercase tracking-wider text-muted-foreground">Message *</Label>
                  <Textarea id="message" placeholder="Type your message details here..." value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className="rounded-xl" />
                </div>

                <Button variant="gold" size="lg" className="w-full rounded-xl font-semibold flex items-center justify-center gap-1.5" loading={loading}>
                  <Send className="h-4 w-4" /> Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </section>

    </div>
  );
}
