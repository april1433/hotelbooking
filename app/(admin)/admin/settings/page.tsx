/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from "@/components/ui";
import { Settings, Hotel, CreditCard, Bell, Shield, Moon, Sun, Save, RefreshCw, Plus, Edit, X, Star, Loader2, MapPin, Trash2, BedDouble } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const SETTINGS_TABS = [
  { id: "hotels", label: "Hotels Management", icon: Hotel },
  { id: "room_types", label: "Room Types", icon: BedDouble },
  { id: "general", label: "System Preferences", icon: Settings },
  { id: "billing", label: "Billing & Tax", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("hotels");
  const [saved, setSaved] = useState(false);

  // Hotels Management states
  const [hotels, setHotels] = useState<any[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [savingHotel, setSavingHotel] = useState(false);

  // Hotel form fields
  const [hotelName, setHotelName] = useState("");
  const [hotelSlug, setHotelSlug] = useState("");
  const [hotelDescription, setHotelDescription] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelCity, setHotelCity] = useState("");
  const [hotelStarRating, setHotelStarRating] = useState("5");
  const [hotelCheckIn, setHotelCheckIn] = useState("14:00");
  const [hotelCheckOut, setHotelCheckOut] = useState("12:00");

  // Room Types states
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [showRtModal, setShowRtModal] = useState(false);
  const [editingRt, setEditingRt] = useState<any>(null);
  const [savingRt, setSavingRt] = useState(false);

  // Room Type form fields
  const [rtName, setRtName] = useState("");
  const [rtHotelId, setRtHotelId] = useState("");
  const [rtDescription, setRtDescription] = useState("");
  const [rtBasePrice, setRtBasePrice] = useState("");
  const [rtMaxOccupancy, setRtMaxOccupancy] = useState("2");

  // Dynamic system settings states
  const [brandName, setBrandName] = useState("Grand Azure PMS");
  const [supportEmail, setSupportEmail] = useState("operations@grandazure.com");
  const [supportPhone, setSupportPhone] = useState("+63 2 8123 4567");
  const [supportAddress, setSupportAddress] = useState("1234 Azure Boulevard, BGC, Taguig City, Metro Manila, Philippines");
  const [vatRate, setVatRate] = useState("12");
  const [stripePublicKey, setStripePublicKey] = useState("pk_live_***");
  const [stripeSecretKey, setStripeSecretKey] = useState("sk_live_***");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [loadingSettings, setLoadingSettings] = useState(true);

  async function fetchHotels() {
    setLoadingHotels(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });
      setHotels(data ?? []);
    } catch (err) {
      console.error("Error loading hotels:", err);
    } finally {
      setLoadingHotels(false);
    }
  }

  async function fetchRoomTypes() {
    setLoadingRoomTypes(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase
        .from("room_types")
        .select("*, hotels(name)")
        .order("created_at", { ascending: false });
      setRoomTypes(data ?? []);
    } catch (err) {
      console.error("Error loading room types:", err);
    } finally {
      setLoadingRoomTypes(false);
    }
  }

  async function fetchSettings() {
    setLoadingSettings(true);
    const supabase = createClient() as any;
    try {
      const { data } = await supabase.from("settings").select("*");
      if (data && data.length > 0) {
        data.forEach((s: any) => {
          if (s.key === "brand_name") setBrandName(s.value);
          if (s.key === "support_email") setSupportEmail(s.value);
          if (s.key === "support_phone") setSupportPhone(s.value);
          if (s.key === "support_address") setSupportAddress(s.value);
          if (s.key === "vat_rate") setVatRate(s.value);
          if (s.key === "stripe_public_key") setStripePublicKey(s.value);
          if (s.key === "stripe_secret_key") setStripeSecretKey(s.value);
          if (s.key === "session_timeout") setSessionTimeout(s.value);
          if (s.key === "max_login_attempts") setMaxLoginAttempts(s.value);
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  }

  useEffect(() => {
    fetchHotels();
    fetchSettings();
    fetchRoomTypes();
  }, []);

  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHotelName(val);
    if (!editingHotel) {
      setHotelSlug(slugify(val));
    }
  };

  const openAddHotelModal = () => {
    setEditingHotel(null);
    setHotelName("");
    setHotelSlug("");
    setHotelDescription("");
    setHotelAddress("");
    setHotelCity("");
    setHotelStarRating("5");
    setHotelCheckIn("14:00");
    setHotelCheckOut("12:00");
    setShowHotelModal(true);
  };

  const openEditHotelModal = (hotel: any) => {
    setEditingHotel(hotel);
    setHotelName(hotel.name);
    setHotelSlug(hotel.slug);
    setHotelDescription(hotel.description || "");
    setHotelAddress(hotel.address);
    setHotelCity(hotel.city || "");
    setHotelStarRating(String(hotel.star_rating || 5));
    setHotelCheckIn(hotel.check_in_time ? hotel.check_in_time.slice(0, 5) : "14:00");
    setHotelCheckOut(hotel.check_out_time ? hotel.check_out_time.slice(0, 5) : "12:00");
    setShowHotelModal(true);
  };

  const handleHotelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName || !hotelSlug || !hotelAddress) {
      toast.error("Please fill in Name, Slug, and Address.");
      return;
    }

    setSavingHotel(true);
    const supabase = createClient() as any;
    try {
      const payload = {
        name: hotelName,
        slug: hotelSlug,
        description: hotelDescription || null,
        address: hotelAddress,
        city: hotelCity || null,
        star_rating: parseInt(hotelStarRating, 10),
        check_in_time: hotelCheckIn + ":00",
        check_out_time: hotelCheckOut + ":00",
        timezone: "Asia/Manila",
        currency: "PHP",
        is_active: true,
      };

      let error;
      if (editingHotel) {
        const { error: err } = await supabase
          .from("hotels")
          .update(payload)
          .eq("id", editingHotel.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("hotels")
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingHotel ? "Hotel details updated." : "New hotel added successfully.");
      setShowHotelModal(false);
      fetchHotels();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save hotel.");
    } finally {
      setSavingHotel(false);
    }
  };

  const handleDeleteHotel = async (hotelId: string, hotelName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${hotelName}"? All rooms, guests, and reservations linked to this property will be permanently deleted.`)) {
      return;
    }
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("hotels")
        .delete()
        .eq("id", hotelId);
      if (error) throw error;
      toast.success(`Property "${hotelName}" deleted successfully.`);
      fetchHotels();
      fetchRoomTypes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to delete property "${hotelName}".`);
    }
  };

  // Room Types Action Handlers
  const openAddRtModal = () => {
    if (hotels.length === 0) {
      toast.error("Please add a Hotel Location first before creating room types.");
      return;
    }
    setEditingRt(null);
    setRtName("");
    setRtHotelId(hotels[0]?.id || "");
    setRtDescription("");
    setRtBasePrice("");
    setRtMaxOccupancy("2");
    setShowRtModal(true);
  };

  const openEditRtModal = (rt: any) => {
    setEditingRt(rt);
    setRtName(rt.name);
    setRtHotelId(rt.hotel_id);
    setRtDescription(rt.description || "");
    setRtBasePrice(String(rt.base_price));
    setRtMaxOccupancy(String(rt.max_occupancy || 2));
    setShowRtModal(true);
  };

  const handleRtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rtName || !rtHotelId || !rtBasePrice) {
      toast.error("Please fill in Room Type Name, Hotel Location, and Base Price.");
      return;
    }

    setSavingRt(true);
    const supabase = createClient() as any;
    try {
      const payload = {
        name: rtName,
        hotel_id: rtHotelId,
        description: rtDescription || null,
        base_price: parseFloat(rtBasePrice),
        max_occupancy: parseInt(rtMaxOccupancy, 10),
        is_active: true,
      };

      let error;
      if (editingRt) {
        const { error: err } = await supabase
          .from("room_types")
          .update(payload)
          .eq("id", editingRt.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("room_types")
          .insert(payload);
        error = err;
      }

      if (error) throw error;

      toast.success(editingRt ? "Room Type updated." : "New Room Type added.");
      setShowRtModal(false);
      fetchRoomTypes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save room type.");
    } finally {
      setSavingRt(false);
    }
  };

  const handleDeleteRt = async (rtId: string, rtName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${rtName}"? Existing physical rooms of this type will also be affected.`)) {
      return;
    }
    const supabase = createClient() as any;
    try {
      const { error } = await supabase
        .from("room_types")
        .delete()
        .eq("id", rtId);
      if (error) throw error;
      toast.success(`Room Type "${rtName}" deleted successfully.`);
      fetchRoomTypes();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || `Failed to delete room type "${rtName}".`);
    }
  };

  const handleGeneralSave = async () => {
    setSaved(true);
    const supabase = createClient() as any;
    try {
      const settingsToSave = [
        { key: "brand_name", value: brandName },
        { key: "support_email", value: supportEmail },
        { key: "support_phone", value: supportPhone },
        { key: "support_address", value: supportAddress },
        { key: "vat_rate", value: vatRate },
        { key: "stripe_public_key", value: stripePublicKey },
        { key: "stripe_secret_key", value: stripeSecretKey },
        { key: "session_timeout", value: sessionTimeout },
        { key: "max_login_attempts", value: maxLoginAttempts },
      ];

      for (const item of settingsToSave) {
        const { data: existing } = await supabase
          .from("settings")
          .select("id")
          .eq("key", item.key)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await supabase
            .from("settings")
            .update({ value: item.value })
            .eq("key", item.key);
          if (updateErr) throw updateErr;
        } else {
          const { error: insertErr } = await supabase
            .from("settings")
            .insert(item);
          if (insertErr) throw insertErr;
        }
      }

      toast.success("System configurations updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update configurations.");
    } finally {
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Settings className="h-7 w-7 text-muted-foreground" /> Settings
          </h1>
          <p className="page-subtitle">Configure hotels, room categories, billing, and security parameters.</p>
        </div>
        {activeTab !== "hotels" && activeTab !== "room_types" && (
          <Button
            variant={saved ? "gold" : "outline"}
            size="sm"
            className="rounded-xl border-border/80"
            onClick={handleGeneralSave}
            disabled={saved}
          >
            {saved ? (
              <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-3.5 w-3.5 mr-2" /> Save Changes</>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-3">
              <nav className="space-y-1">
                {SETTINGS_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-navy-800 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content panel */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* HOTELS MANAGEMENT TAB */}
          {activeTab === "hotels" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
                <div>
                  <CardTitle className="text-lg font-display">Hotels & Properties</CardTitle>
                  <CardDescription>Add, view, and configure multiple hotel locations.</CardDescription>
                </div>
                <Button onClick={openAddHotelModal} variant="gold" size="sm" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Hotel
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loadingHotels ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                    <span className="text-xs">Loading hotels index...</span>
                  </div>
                ) : hotels.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-2xl">
                    <Hotel className="h-10 w-10 text-muted-foreground/45 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No properties setup yet</p>
                    <p className="text-xs text-slate-400">Click the Add Hotel button to setup your first property.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotels.map((hotel) => (
                      <Card key={hotel.id} className="relative group border-border/40 hover:shadow-luxury-hover transition-all duration-300">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="text-base font-bold text-slate-800 font-display">{hotel.name}</h4>
                              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {hotel.star_rating || 5}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono bg-slate-100 dark:bg-charcoal-800 px-2 py-0.5 rounded mt-1.5 inline-block">
                              /{hotel.slug}
                            </span>
                            
                            <div className="space-y-1.5 mt-4 text-xs text-slate-500">
                              <p className="flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                                <span>{hotel.address}</span>
                              </p>
                              <p>City: <span className="font-semibold text-slate-700">{hotel.city || "—"}</span></p>
                              <p>Check-In/Out: <span className="font-semibold text-slate-700">{hotel.check_in_time?.slice(0, 5)} / {hotel.check_out_time?.slice(0, 5)}</span></p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-border/40 flex justify-between gap-2">
                            <Button 
                              onClick={() => handleDeleteHotel(hotel.id, hotel.name)} 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg text-xs h-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                            </Button>
                            <Button onClick={() => openEditHotelModal(hotel)} variant="outline" size="sm" className="rounded-lg text-xs h-8">
                              <Edit className="h-3 w-3 mr-1.5" /> Edit Settings
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ROOM TYPES TAB */}
          {activeTab === "room_types" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 mb-4">
                <div>
                  <CardTitle className="text-lg font-display">Room Categories & Pricing</CardTitle>
                  <CardDescription>Setup different room types (e.g. Deluxe Room, Suite) and pricing per hotel location.</CardDescription>
                </div>
                <Button onClick={openAddRtModal} variant="gold" size="sm" className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Room Type
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loadingRoomTypes ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                    <span className="text-xs">Loading room categories...</span>
                  </div>
                ) : roomTypes.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border/40 rounded-2xl">
                    <BedDouble className="h-10 w-10 text-muted-foreground/45 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">No Room Types configured</p>
                    <p className="text-xs text-slate-400">Add room types to group room allocations and define default rates.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roomTypes.map((rt) => (
                      <Card key={rt.id} className="relative group border-border/40 hover:shadow-luxury-hover transition-all duration-300">
                        <CardContent className="p-5 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-slate-800 font-display">{rt.name}</h4>
                                <span className="text-[10px] text-muted-foreground font-mono font-medium block mt-0.5">
                                  {rt.hotels?.name || "Unknown Hotel"}
                                </span>
                              </div>
                              <span className="text-xs text-gold-600 font-bold bg-gold-50 px-2 py-0.5 rounded-lg border border-gold-100">
                                {formatCurrency(rt.base_price)}/night
                              </span>
                            </div>
                            
                            {rt.description && (
                              <p className="text-xs text-slate-400 mt-3 line-clamp-2 italic">"{rt.description}"</p>
                            )}

                            <div className="space-y-1 mt-4 text-xs text-slate-500">
                              <p>Max Occupancy: <span className="font-semibold text-slate-700">{rt.max_occupancy || 2} Guests</span></p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-border/40 flex justify-between gap-2">
                            <Button 
                              onClick={() => handleDeleteRt(rt.id, rt.name)} 
                              variant="outline" 
                              size="sm" 
                              className="rounded-lg text-xs h-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                            </Button>
                            <Button onClick={() => openEditRtModal(rt)} variant="outline" size="sm" className="rounded-lg text-xs h-8">
                              <Edit className="h-3 w-3 mr-1.5" /> Edit Category
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* GENERAL PREFERENCES TAB */}
          {activeTab === "general" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-display">System Configuration</CardTitle>
                  <CardDescription>Default system details and parameters.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {loadingSettings ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> Loading configuration parameters...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="sysBrandName">Standard Platform Name</Label>
                        <Input
                          id="sysBrandName"
                          value={brandName}
                          onChange={e => setBrandName(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sysSupportEmail">Operational Contact Email</Label>
                        <Input
                          id="sysSupportEmail"
                          type="email"
                          value={supportEmail}
                          onChange={e => setSupportEmail(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sysSupportPhone">Operational Contact Phone</Label>
                        <Input
                          id="sysSupportPhone"
                          value={supportPhone}
                          onChange={e => setSupportPhone(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="sysSupportAddress">Corporate Address</Label>
                        <Input
                          id="sysSupportAddress"
                          value={supportAddress}
                          onChange={e => setSupportAddress(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-display">Appearance</CardTitle>
                  <CardDescription>Interface display preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/40">
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle between light and dark interface.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-muted-foreground" />
                      <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-navy-700 transition-colors focus:outline-none">
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                      </button>
                      <Moon className="h-4 w-4 text-navy-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Billing & Tax Configuration</CardTitle>
                <CardDescription>Configure tax rates, payment methods, and billing settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingSettings ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> Loading configuration parameters...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="sysVatRate">VAT Rate (%)</Label>
                      <Input
                        id="sysVatRate"
                        type="number"
                        min="0"
                        max="100"
                        value={vatRate}
                        onChange={e => setVatRate(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input defaultValue="PHP (Philippine Peso)" className="rounded-xl" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sysStripePub">Stripe Public Key</Label>
                      <Input
                        id="sysStripePub"
                        type="password"
                        value={stripePublicKey}
                        onChange={e => setStripePublicKey(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sysStripeSec">Stripe Secret Key</Label>
                      <Input
                        id="sysStripeSec"
                        type="password"
                        value={stripeSecretKey}
                        onChange={e => setStripeSecretKey(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">⚠️ Payment keys are stored encrypted and never exposed to guests.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Notification Preferences</CardTitle>
                <CardDescription>Choose when and how you receive system notifications.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "New Reservations", desc: "Alert when a new booking is made", enabled: true },
                  { label: "Payment Received", desc: "Notify on successful payment", enabled: true },
                  { label: "Cancellation Requests", desc: "Alert when a guest requests cancellation", enabled: true },
                  { label: "Low Inventory Alert", desc: "Warning when stock falls below minimum", enabled: true },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none bg-navy-700">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Security Settings</CardTitle>
                <CardDescription>Access control and authentication configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {loadingSettings ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> Loading configuration parameters...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="sysSessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sysSessionTimeout"
                        type="number"
                        value={sessionTimeout}
                        onChange={e => setSessionTimeout(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sysMaxAttempts">Max Login Attempts</Label>
                      <Input
                        id="sysMaxAttempts"
                        type="number"
                        value={maxLoginAttempts}
                        onChange={e => setMaxLoginAttempts(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add / Edit Hotel Modal Overlay */}
      {showHotelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/40">
              <h3 className="font-semibold text-lg font-display text-foreground">{editingHotel ? "Edit Hotel Property" : "Add Hotel Property"}</h3>
              <button onClick={() => setShowHotelModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleHotelSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="modalHotelName" className="text-xs">Hotel Property Name</Label>
                <Input
                  id="modalHotelName"
                  required
                  placeholder="Grand Azure Oasis"
                  value={hotelName}
                  onChange={handleNameChange}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modalHotelSlug" className="text-xs">URL Slug</Label>
                <Input
                  id="modalHotelSlug"
                  required
                  placeholder="grand-azure-oasis"
                  value={hotelSlug}
                  onChange={e => setHotelSlug(slugify(e.target.value))}
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modalHotelDesc" className="text-xs">Description</Label>
                <textarea
                  id="modalHotelDesc"
                  placeholder="Describe this property..."
                  value={hotelDescription}
                  onChange={e => setHotelDescription(e.target.value)}
                  className="w-full min-h-[70px] border border-input rounded-xl bg-background p-3 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modalHotelAddress" className="text-xs">Complete Address</Label>
                <Input
                  id="modalHotelAddress"
                  required
                  placeholder="Station 2, Beachfront..."
                  value={hotelAddress}
                  onChange={e => setHotelAddress(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modalHotelCity" className="text-xs">City / Region</Label>
                <Input
                  id="modalHotelCity"
                  placeholder="Boracay"
                  value={hotelCity}
                  onChange={e => setHotelCity(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Stars</Label>
                  <select value={hotelStarRating} onChange={e => setHotelStarRating(e.target.value)} className="w-full h-9 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none">
                    <option value="5">5 Star</option>
                    <option value="4">4 Star</option>
                    <option value="3">3 Star</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Check-In</Label>
                  <Input type="time" value={hotelCheckIn} onChange={e => setHotelCheckIn(e.target.value)} className="rounded-xl h-9 px-2 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Check-Out</Label>
                  <Input type="time" value={hotelCheckOut} onChange={e => setHotelCheckOut(e.target.value)} className="rounded-xl h-9 px-2 text-xs" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowHotelModal(false)} className="flex-1 rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={savingHotel} className="flex-1 rounded-xl h-10 flex items-center justify-center gap-1.5">
                  {savingHotel ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Property"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Room Type Modal Overlay */}
      {showRtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-charcoal-900 border border-border/40 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-muted/40">
              <h3 className="font-semibold text-lg font-display text-foreground">{editingRt ? "Edit Room Category" : "Add Room Category"}</h3>
              <button onClick={() => setShowRtModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleRtSubmit} className="p-6 space-y-4">
              
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="modalRtName" className="text-xs">Category Name</Label>
                <Input
                  id="modalRtName"
                  required
                  placeholder="Deluxe King Suite"
                  value={rtName}
                  onChange={e => setRtName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Hotel selection */}
              <div className="space-y-1.5">
                <Label htmlFor="modalRtHotel" className="text-xs">Hotel Location</Label>
                <select 
                  id="modalRtHotel"
                  value={rtHotelId} 
                  onChange={e => setRtHotelId(e.target.value)} 
                  className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Pricing & Occupancy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalRtPrice" className="text-xs">Base Rate per Night</Label>
                  <Input
                    id="modalRtPrice"
                    type="number"
                    min="1"
                    required
                    placeholder="3500"
                    value={rtBasePrice}
                    onChange={e => setRtBasePrice(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modalRtOccupancy" className="text-xs">Max Occupancy</Label>
                  <select 
                    id="modalRtOccupancy"
                    value={rtMaxOccupancy} 
                    onChange={e => setRtMaxOccupancy(e.target.value)} 
                    className="w-full h-10 border border-input rounded-xl bg-background px-3 text-sm focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} Guests</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="modalRtDesc" className="text-xs">Description</Label>
                <textarea
                  id="modalRtDesc"
                  placeholder="Describe this category features (e.g. King-sized bed, ocean view)..."
                  value={rtDescription}
                  onChange={e => setRtDescription(e.target.value)}
                  className="w-full min-h-[80px] border border-input rounded-xl bg-background p-3 text-sm focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRtModal(false)} className="flex-1 rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={savingRt} className="flex-1 rounded-xl h-10 flex items-center justify-center gap-1.5">
                  {savingRt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Category"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
