import React, { useState } from "react";
import { Flame, Mail, ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

interface AuthModalProps {
  onLogin: (email: string, displayName: string, photoUrl?: string) => void;
  onClose?: () => void;
  isDismissable?: boolean;
}

type AuthStep = "email" | "otp";

export default function AuthModal({ onLogin, onClose, isDismissable = true }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<AuthStep>("email");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Enter a valid email address to receive your Glaze access code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send access code.");

      setStep("otp");
      setNotice(data.message || `We sent a temporary access code to ${normalizedEmail}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send access code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanOtp.length !== 6) {
      setError("Enter the 6 digit code from your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, otp: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired code.");

      onLogin(normalizedEmail, data.user?.displayName || normalizedEmail.split("@")[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm border glass-panel rounded-3xl border-white/10 overflow-hidden bg-black shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)]">
        <div className="relative flex flex-col items-center pt-8 pb-4 text-center">
          {isDismissable && onClose && (
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 text-white/35 hover:text-white transition text-xs font-mono"
            >
              Close
            </button>
          )}

          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 mb-3 shadow-[0_0_24px_rgba(255,107,0,0.25)]">
            <Flame className="w-6 h-6 text-[#FF6B00]" />
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white mb-1">
            Welcome to Glaze
          </h2>
          <p className="text-white/45 text-xs tracking-wide px-6">
            Sign up or log in with email only. No passwords, no fake demo accounts.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 text-xs font-medium border border-red-500/20 bg-red-500/10 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {notice && (
            <div className="p-3 mb-4 text-xs font-medium border border-[#FF6B00]/20 bg-[#FF6B00]/10 rounded-lg text-[#FF6B00]">
              {notice}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 pl-1 font-mono">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joli@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00] transition"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-black bg-[#FF6B00] hover:bg-[#E05E00] transition duration-200 rounded-2xl cursor-pointer hover:scale-102 active:scale-98 shadow-[0_0_15px_rgba(255,107,0,0.3)] disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? "Sending code..." : "Send Email Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="flex items-center gap-2 text-[11px] text-white/45 hover:text-[#FF6B00] transition font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change email
              </button>

              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 pl-1 font-mono">
                  Temporary access code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6 digit code"
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00] transition tracking-[0.35em] font-mono"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-black bg-[#FF6B00] hover:bg-[#E05E00] transition duration-200 rounded-2xl cursor-pointer hover:scale-102 active:scale-98 shadow-[0_0_15px_rgba(255,107,0,0.3)] disabled:opacity-60 disabled:cursor-wait"
              >
                {isSubmitting ? "Verifying..." : "Enter Glaze"}
              </button>
            </form>
          )}
        </div>

        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Email OTP acts as your temporary password for this session.</span>
        </div>
      </div>
    </div>
  );
}
