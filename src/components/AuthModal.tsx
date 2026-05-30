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

  const startGoogleAuth = () => {
    window.location.href = "/api/auth/google/start";
  };

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
            Sign up or log in with Google or email OTP. No passwords required.
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
            <div className="space-y-4">
              <button
                onClick={startGoogleAuth}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold transition duration-200 border rounded-2xl glass-pill hover:bg-white/10 hover:border-white/20 text-white cursor-pointer hover:scale-102 active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-white/30 text-[10px] uppercase tracking-widest font-mono">or use email code</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

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
            </div>
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
          <span>Google auth and email OTP both create a secure Glaze session.</span>
        </div>
      </div>
    </div>
  );
}
