import React, { useState } from "react";
import { Sparkles, Mail, User, ShieldCheck, Flame } from "lucide-react";

interface AuthModalProps {
  onLogin: (email: string, displayName: string, photoUrl?: string) => void;
  onClose?: () => void;
  isDismissable?: boolean;
}

export default function AuthModal({ onLogin, onClose, isDismissable = true }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide a valid email pointer");
      return;
    }
    const name = displayName || email.split("@")[0];
    onLogin(email, name);
  };

  const handleSimulatedGoogleLogin = () => {
    // Generate beautiful random designer profiles to speed up Google Auth in sandbox
    const randomNames = ["Cassius Cole", "Helena Brandt", "Liam Vance", "Nadia Vance", "Eren Jaeger"];
    const randomEmails = ["cassius@glaze.social", "helena@glaze.social", "liam@vance.io", "nadia@glaze.email", "eren@surveycorps.org"];
    const idx = Math.floor(Math.random() * randomNames.length);

    onLogin(randomEmails[idx], randomNames[idx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-sm border glass-panel rounded-3xl border-white/10 overflow-hidden bg-black shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)]">
        
        {/* Brand visual header representation */}
        <div className="flex flex-col items-center pt-8 pb-4 text-center">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 mb-3 shadow-[0_0_24px_rgba(255,107,0,0.25)]">
            {/* Minimalist modern logo representation - Sleek Flame of Glaze */}
            <Flame className="w-6 h-6 text-[#FF6B00]" />
          </div>
          <h2 className="font-display font-bold text-3xl tracking-tight text-white mb-1">
            Glaze
          </h2>
          <p className="text-white/45 text-xs tracking-wide px-6">
            Welcome to Glaze, connect, explore and discover your voice
          </p>
        </div>

        {/* Traditional Auth and Google Auth panel selection */}
        <div className="p-6">
          {error && (
            <div className="p-3 mb-4 text-xs font-medium border border-red-500/20 bg-red-500/10 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Quick simulated OAuth One-Click button */}
            <button
              onClick={handleSimulatedGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium transition duration-200 border rounded-2xl glass-pill hover:bg-white/10 hover:border-white/20 text-white cursor-pointer hover:scale-102 active:scale-98"
            >
              {/* Clean Google icon representation using stylized vector colors */}
              <svg className="w-4 h-4 cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.53-6.16-4.53z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-white/30 text-[10px] uppercase tracking-widest font-mono">or connect via email</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 pl-1 font-mono">
                  Email pointer
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00] transition"
                  />
                </div>
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 pl-1 font-mono">
                    Display Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Liam Brandt"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00] transition"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-black bg-[#FF6B00] hover:bg-[#E05E00] transition duration-200 rounded-2xl cursor-pointer hover:scale-102 active:scale-98 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
              >
                {isSignUp ? "Sign Up to Glaze" : "Access Glaze Timeline"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                type="button"
                className="text-xs text-[#FF6B00] hover:underline focus:outline-none cursor-pointer font-semibold"
              >
                {isSignUp ? "Already have an account? Sign In" : "Need a profile? Sign up here"}
              </button>
            </div>
          </div>
        </div>

        {/* Security / Terms confirmation info footer */}
        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>Glaze utilizes military-grade SSL. Secure session verified.</span>
        </div>
      </div>
    </div>
  );
}
