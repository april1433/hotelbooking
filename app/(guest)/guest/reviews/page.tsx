"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Textarea } from "@/components/ui";
import { Star, MessageSquarePlus, CheckCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Review = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reservation = Record<string, any>;

const STARS = [1, 2, 3, 4, 5];

export default function GuestReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedResId, setSelectedResId] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function fetchReviewsAndStays() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    try {
      const [reviewsRes, staysRes] = await Promise.all([
        supabase
          .from("reviews")
          .select("*, reservations(room_types(name), rooms(room_number))")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reservations")
          .select("id, confirmation_number, check_in_date, check_out_date, room_types(name), rooms(room_number)")
          .eq("profile_id", user.id)
          .in("status", ["confirmed", "checked_in", "checked_out"]),
      ]);

      setReviews(reviewsRes.data ?? []);
      const stays = (staysRes.data ?? []) as Reservation[];
      setReservations(stays);
      if (stays.length > 0) {
        setSelectedResId(stays[0].id);
      }
    } catch {
      setReviews([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviewsAndStays();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !newRating || !newBody.trim() || !selectedResId) return;
    const supabase = createClient() as any;
    try {
      // Retrieve hotel_id and guest_id from reservation
      const { data: resDetail } = await supabase
        .from("reservations")
        .select("hotel_id, guest_id")
        .eq("id", selectedResId)
        .single();

      await supabase
        .from("reviews")
        .insert({
          profile_id: user.id,
          guest_id: resDetail?.guest_id || null,
          hotel_id: resDetail?.hotel_id || null,
          reservation_id: selectedResId,
          overall_rating: newRating,
          title: newTitle,
          body: newBody,
          is_published: true, // Auto-publish for guest dashboard
        } as any);
      setSubmitted(true);
      fetchReviewsAndStays();
    } catch (err) {
      console.error("Failed to submit review:", err);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.overall_rating ?? 0), 0) / reviews.length : 0;

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Reviews</h1>
          <p className="page-subtitle">Share your experience and read your past reviews.</p>
        </div>
        <Button onClick={fetchReviewsAndStays} variant="outline" size="sm" className="rounded-xl">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Reviews Written</p>
            <p className="text-2xl font-bold">{loading ? "—" : reviews.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gold-500">{loading ? "—" : avgRating.toFixed(1)}</p>
              {!loading && reviews.length > 0 && (
                <div className="flex">
                  {STARS.map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-gold-400 text-gold-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Completed Stays</p>
            <p className="text-2xl font-bold">{loading ? "—" : reservations.length}</p>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {[...Array(2)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Past Reviews */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-lg font-semibold">My Reviews</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm border border-dashed rounded-xl bg-card">
                <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
                No reviews written yet. After checking out of a room, you can leave a review of your experience.
              </div>
            ) : (
                 reviews.map(r => {
                 const room = r.reservations?.rooms;
                 const roomTypeName = r.reservations?.room_types?.name ?? "Room";
                 return (
                   <Card key={r.id} className="group hover:shadow-luxury-hover transition-all duration-300">
                     <CardContent className="p-5">
                       <div className="flex items-start justify-between mb-3">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             {STARS.map(s => (
                               <Star key={s} className={`h-4 w-4 ${s <= r.overall_rating ? "fill-gold-400 text-gold-400" : "text-muted-foreground/20"}`} />
                             ))}
                             <span className="text-xs text-muted-foreground ml-1">· {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</span>
                           </div>
                           <h3 className="font-semibold text-sm">{r.title ?? "Untitled"}</h3>
                           <p className="text-xs text-muted-foreground">
                             {room?.room_number ? `Room ${room.room_number}` : "Room Assigned at Check-in"} ({roomTypeName})
                           </p>
                         </div>
                       </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>

                      {r.response && (
                        <div className="mt-4 p-3 bg-navy-50 dark:bg-navy-900/30 rounded-xl border border-navy-200 dark:border-navy-700">
                          <p className="text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">Hotel Response</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{r.response}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Write Review */}
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-muted-foreground" /> Write a Review
                </CardTitle>
                <CardDescription>Share your experience from your last stay.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submitted ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="font-semibold text-sm">Review Submitted!</p>
                    <p className="text-xs text-muted-foreground mt-1">Thank you for sharing your experience.</p>
                  </div>
                ) : reservations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    You can only write reviews for completed (checked-out) stays.
                  </p>
                ) : (
                  <>
                    {/* Stay selector */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Select Stay</p>
                      <select
                        value={selectedResId}
                        onChange={e => setSelectedResId(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                      >
                        {reservations.map(res => (
                          <option key={res.id} value={res.id}>
                            {res.rooms?.room_number ? `Room ${res.rooms.room_number}` : (res.room_types?.name ?? "Stay")} ({res.check_in_date} to {res.check_out_date})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Star rating */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your Rating</p>
                      <div className="flex gap-1.5">
                        {STARS.map(s => (
                          <button key={s}
                            type="button"
                            onMouseEnter={() => setHovered(s)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setNewRating(s)}>
                            <Star className={`h-7 w-7 transition-colors ${s <= (hovered || newRating) ? "fill-gold-400 text-gold-400" : "text-muted-foreground/30"}`} />
                          </button>
                        ))}
                        {newRating > 0 && (
                          <span className="text-xs text-gold-600 font-medium ml-1 self-center">
                            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][newRating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Review Title</p>
                      <input
                        className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                        placeholder="Summarize your experience"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your Review</p>
                      <Textarea
                        placeholder="Tell us about your stay, the staff, the room, and anything memorable…"
                        className="rounded-xl"
                        rows={4}
                        value={newBody}
                        onChange={e => setNewBody(e.target.value)}
                      />
                    </div>

                    <Button variant="gold" className="w-full rounded-xl" onClick={handleSubmit}
                      disabled={!newRating || !newBody.trim() || !selectedResId}>
                      Submit Review
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
