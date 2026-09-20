/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ArrowLeft, Smartphone, ShieldCheck, KeyRound, Receipt } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

export default function GCashMockPortal() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Mobile Number, 2: OTP, 3: MPIN, 4: Pay, 5: Success
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [mpin, setMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");
  const [brandName, setBrandName] = useState("Grand Azure Hotel");

  useEffect(() => {
    // Retrieve booking session
    const data = sessionStorage.getItem("azure_pending_booking");
    if (!data) {
      toast.error("No pending booking details found.");
      router.push("/booking");
      return;
    }
    setBookingData(JSON.parse(data));

    async function loadBrandName() {
      const supabase = createClient() as any;
      try {
        const { data: config } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "brand_name")
          .maybeSingle();
        if (config?.value) {
          setBrandName(config.value);
        }
      } catch (err) {
        console.error("Failed to load brand name:", err);
      }
    }
    loadBrandName();
  }, [router]);

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Redirecting to GCash...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.match(/^(09|\+639)\d{9}$/)) {
      toast.error("Please enter a valid GCash mobile number (e.g. 09171234567)");
      return;
    }
    // Generate a random 6-digit OTP code to display as mock helper
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockOtp(code);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      toast.info(`Mock OTP Sent: ${code}`, { duration: 8000 });
    }, 1200);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== mockOtp && otp !== "123456") {
      toast.error("Invalid authentication code. Use " + mockOtp + " or 123456");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleMpinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mpin.length !== 4 || !/^\d+$/.test(mpin)) {
      toast.error("Please enter a valid 4-digit MPIN");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
    }, 1000);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout/gcash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process GCash transaction");
      }

      setStep(5);
      // Remove pending session
      sessionStorage.removeItem("azure_pending_booking");
      setTimeout(() => {
        router.push("/guest/reservations?success=true");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected transaction error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-[#1e293b] font-sans flex flex-col justify-between">
      
      {/* Blue Header */}
      <header className="bg-[#005ef6] text-white py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-black text-2xl tracking-tighter italic">g) gcash</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-medium">Portal</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/75 font-semibold uppercase tracking-wider">Merchant</p>
          <p className="text-xs font-bold truncate max-w-[160px]">{brandName}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Top Payment Info */}
          <div className="bg-[#f0f4fc] p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Amount to Pay</p>
                <p className="text-xl font-black text-slate-800">{formatCurrency(bookingData.totalAmount)}</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-medium">
              <p>Room: {bookingData.roomTypeName.split(" ")[0]}</p>
              <p>{bookingData.checkInDate} stay</p>
            </div>
          </div>

          <div className="p-8">
            {step === 1 && (
              <form onSubmit={handleMobileSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-800">Login with your GCash Number</h2>
                  <p className="text-xs text-slate-400">Please enter your 11-digit mobile number registered in GCash.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mobile Number</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="09171234567"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#005ef6] hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "NEXT"}
                </button>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem("azure_pending_booking");
                      router.push("/booking");
                    }}
                    className="text-xs text-slate-400 font-medium flex items-center gap-1 hover:text-slate-600 transition-colors"
                  >
                    <ArrowLeft className="h-3 w-3" /> Cancel Booking
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-800">Verification Code</h2>
                  <p className="text-xs text-slate-400">
                    We sent a mock 6-digit authentication code to <span className="font-bold text-slate-700">{mobileNumber}</span>.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Authentication Code</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold tracking-widest text-center"
                    />
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium text-center">
                    Mock Code Sent: <span className="font-bold underline">{mockOtp}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#005ef6] hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "VERIFY"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleMpinSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-800">Enter your 4-Digit MPIN</h2>
                  <p className="text-xs text-slate-400">Provide your personal identification number to proceed.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GCash MPIN</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="••••"
                      value={mpin}
                      onChange={(e) => setMpin(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-bold tracking-widest text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#005ef6] hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "LOG IN"}
                </button>
              </form>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-extrabold text-slate-800">Confirm Payment</h2>
                  <p className="text-xs text-slate-400">Review your payment details before finalizing the transaction.</p>
                </div>

                <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 space-y-3 text-xs leading-normal">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Source Account</span>
                    <span className="font-extrabold text-slate-700">GCash ({mobileNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">GCash Balance</span>
                    <span className="font-extrabold text-slate-700">{formatCurrency(50000.00)}</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-3 flex justify-between font-bold">
                    <span className="text-slate-500">Amount Due</span>
                    <span className="text-blue-600 text-sm font-black">{formatCurrency(bookingData.totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-[#005ef6] hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pay ${formatCurrency(bookingData.totalAmount)}`}
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="text-center space-y-6 py-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-md">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-800">Payment Successful!</h2>
                  <p className="text-xs text-slate-400">
                    Grand Azure Hotel has received your payment. Redirecting you to your reservation log...
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium justify-center animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" /> Connecting back to hotel system...
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="py-4 text-center text-[10px] text-slate-400/90 font-medium px-4">
        <p>This is a secure mock payment gateway for testing and validation within the Hotel PMS developer console.</p>
        <p className="mt-0.5">GCash © 2026. Powered by Mynt (G-Xchange, Inc.).</p>
      </footer>

    </div>
  );
}
