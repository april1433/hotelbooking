"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Textarea } from "@/components/ui";
import { User, Mail, Phone, Globe, MapPin, Save, Camera, Lock, Key } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GuestProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"profile" | "security">("profile");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setNationality(profile.nationality ?? "");
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          nationality,
          address,
        } as any)
        .eq("id", user.id);

      if (!error) {
        setSaved(true);
        refreshProfile();
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and account security.</p>
        </div>
        <Button variant={saved ? "gold" : "outline"} size="sm" className="rounded-xl" onClick={handleSave}>
          <Save className="h-3.5 w-3.5 mr-2" /> {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Avatar & Name Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white text-3xl font-bold">
                {firstName?.[0] ?? "G"}{lastName?.[0] ?? ""}
              </div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white hover:bg-gold-600 transition-colors shadow-lg">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-display font-semibold">
                {firstName || "Valued"} {lastName || "Guest"}
              </h2>
              <p className="text-sm text-muted-foreground">{email ?? "guest@email.com"}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
                  ⭐ Guest Account
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "profile" as const, label: "Personal Info", icon: User },
          { id: "security" as const, label: "Security", icon: Lock },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all ${tab === t.id ? "bg-navy-800 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Personal Information</CardTitle>
              <CardDescription>Update your name and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={email} disabled className="pl-9 rounded-xl opacity-60 bg-muted" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} className="pl-9 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nationality</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={nationality} onChange={e => setNationality(e.target.value)} className="pl-9 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Address &amp; Preferences</CardTitle>
              <CardDescription>Customize your stay details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Home Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea value={address} onChange={e => setAddress(e.target.value)} className="pl-9 rounded-xl" rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Change Password</CardTitle>
            <CardDescription>Ensure your account is using a secure password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 max-w-md">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Enter current password" className="pl-9 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Min. 8 characters" className="pl-9 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" placeholder="Re-enter new password" className="pl-9 rounded-xl" />
              </div>
            </div>
            <Button variant="gold" className="rounded-xl">Update Password</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
