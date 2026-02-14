"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Mail, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

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
      window.location.href = "/chat";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      window.location.href = "/chat";
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900/10 dark:selection:bg-white/15">
      {/* Gradient background */}
      <div className="fixed inset-0 z-0 gradient-landing" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-6 md:px-12">
        <Link
          href="/"
          className="text-xs font-bold tracking-[0.3em] uppercase text-neutral-800/80 dark:text-neutral-200/80 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          TradvisorAI
        </Link>
        <ThemeToggle />
      </nav>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm animate-heroFadeIn">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.3em]">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-neutral-900 dark:text-neutral-100 tracking-tighter mt-4">
              <span className="font-light italic">
                {isSignUp ? "Join" : "Sign"}
              </span>{" "}
              <span className="font-normal">
                {isSignUp ? "Us" : "In"}
              </span>
            </h1>
            <div className="h-[1px] w-10 bg-neutral-300/60 dark:bg-neutral-600/60 mx-auto mt-5" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
              {isSignUp
                ? "Sign up to start researching stocks"
                : "Continue your research"
              }
            </p>
          </div>

          {/* Error / Message */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/15 dark:text-red-400">{error}</div>
          )}
          {message && (
            <div className="mb-5 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{message}</div>
          )}

          {/* Google Auth */}
          <button onClick={handleGoogleLogin} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-750">
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700 dark:border-neutral-600 dark:border-t-white" />
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

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">or</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600 dark:text-neutral-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-neutral-700" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-600 dark:text-neutral-300">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-neutral-700" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors dark:hover:text-neutral-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-neutral-900 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-neutral-900">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-neutral-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-neutral-100 dark:to-white" />
              {loading ? (
                <div className="relative z-10 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-300/30 dark:border-t-neutral-900" />
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="font-medium text-neutral-800 hover:underline underline-offset-2 dark:text-white">
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
