"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  TrendingUp,
  Bot,
  BarChart3,
  Shield,
  ArrowRight,
  ArrowUp,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  LineChart,
  Activity,
} from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("Login error:", error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(false); return; }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setMessage("Account created! Check your email to confirm, then sign in.");
        setIsSignUp(false);
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      window.location.href = "/";
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel: Auth Form — cool blue-gray */}
      <div className="flex w-full lg:w-[48%] flex-col items-center justify-center bg-[#f5f7fa] px-8 lg:px-16 dark:bg-[#0b1120]">
        <div className="w-full max-w-[400px] animate-fadeIn">
          {/* Logo — cyan-blue gradient */}
          <div className="relative inline-block">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 shadow-lg shadow-blue-500/15 ring-1 ring-blue-400/15">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-blue-100/50 dark:bg-slate-800 dark:ring-slate-700">
              <Sparkles className="h-3 w-3 text-cyan-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mt-8 mb-1.5 font-serif text-[2rem] font-semibold text-slate-800 tracking-tight dark:text-white">
            {isSignUp ? "Create Account" : (<>Welcome <span className="italic">Back</span></>)}
          </h1>
          <p className="mb-8 text-[13px] text-slate-500 leading-relaxed dark:text-slate-400">
            {isSignUp ? "Sign up to start your AI equity research journey" : "Sign in to continue your investment analysis"}
          </p>

          {/* Error / Message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200/50 bg-red-50/70 px-4 py-3 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/15 dark:text-red-400">{error}</div>
          )}
          {message && (
            <div className="mb-5 rounded-xl border border-blue-200/50 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/15 dark:text-blue-400">{message}</div>
          )}

          {/* Google Auth */}
          <button onClick={handleGoogleLogin} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/50 bg-white px-4 py-3 text-[13px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md hover:border-slate-300/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/60">
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800 dark:border-slate-600 dark:border-t-white" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* GitHub Auth */}
          <button disabled={loading} className="mt-2.5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/50 bg-white px-4 py-3 text-[13px] font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md hover:border-slate-300/50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:bg-slate-800/60">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {/* OR Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200/60 dark:to-slate-700/40" />
            <span className="editorial-label">or</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200/60 dark:to-slate-700/40" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200/50 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/12 transition-all dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/12" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-600 dark:text-slate-300">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200/50 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/12 transition-all dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/12" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-[13px] font-medium text-white shadow-md transition-all duration-200 hover:bg-slate-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-300/30 dark:border-t-slate-900" />
              ) : (
                <>{isSignUp ? "Create Account" : "Sign In"}<ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-7 text-[13px] text-slate-500 dark:text-slate-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="font-medium text-slate-800 hover:underline underline-offset-2 dark:text-white">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          <p className="mt-8 text-[11px] text-slate-400/60 leading-relaxed dark:text-slate-500/50">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Right Panel: Blue-Gray Gradient Mesh */}
      <div className="hidden lg:flex lg:w-[52%] gradient-mesh-blue gradient-mesh-animated relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent" />

        <div className="relative mx-8 w-full max-w-md space-y-6 animate-fadeInUp">
          {/* Brand mark */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/25 backdrop-blur-sm">
              <TrendingUp className="h-3.5 w-3.5 text-slate-700" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600/70">TradvisorAI</span>
          </div>

          {/* Floating prompt box */}
          <div className="glass-card rounded-2xl p-5 shadow-xl animate-float-gentle">
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Analyze AAPL — is it overvalued?" className="flex-1 bg-transparent text-sm text-slate-600 placeholder:text-slate-500 outline-none" readOnly />
              <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/15 transition-transform hover:scale-105">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            <FeatureCard icon={<Bot className="h-5 w-5" />} title="Autonomous Research" description="Agent gathers data, builds models, and delivers valuations" delay="0.1s" />
            <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Real Financial Models" description="DCF, PE analysis, moat scoring — not just opinions" delay="0.2s" />
            <FeatureCard icon={<Shield className="h-5 w-5" />} title="Transparent Process" description="Watch the agent work step-by-step in real time" delay="0.3s" />
            <FeatureCard icon={<LineChart className="h-5 w-5" />} title="Institutional Grade" description="Methodology used by professional equity analysts" delay="0.4s" />
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Activity className="h-3 w-3 text-slate-500/40" />
            <p className="text-center text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500/50">Powered by AI · Built for serious investors</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay = "0s" }: { icon: React.ReactNode; title: string; description: string; delay?: string }) {
  return (
    <div className="glass-card flex items-start gap-3.5 rounded-xl p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01] animate-fadeInUp" style={{ animationDelay: delay }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/8 text-blue-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 tracking-tight">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}
