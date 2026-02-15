import Link from "next/link";
import { ArrowRight, BarChart3, Search, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900/10 dark:selection:bg-white/15 overflow-hidden">
      {/* Gradient background */}
      <div className="fixed inset-0 z-0 gradient-landing" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-6 md:px-12 backdrop-blur-sm">
        <div className="text-xs font-bold tracking-[0.3em] uppercase text-neutral-800 dark:text-white">
          TradvisorAI
        </div>
        <div className="flex items-center gap-5">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-[10px] font-bold uppercase text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors tracking-[0.2em]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center space-y-6 max-w-3xl">
          {/* Label */}
          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.3em] animate-heroFadeIn">
            AI-Powered Equity Research
          </span>

          {/* Main Title — Large serif like the Muse AI style */}
          <h1 className="font-serif text-6xl md:text-8xl text-neutral-900 dark:text-neutral-100 tracking-tighter animate-heroFadeIn">
            <span className="block font-light italic">
              Tradvisor
            </span>
            <span className="block font-normal mt-[-0.1em]">
              AI
            </span>
          </h1>

          {/* Divider */}
          <div className="h-[1px] w-16 bg-neutral-400/40 dark:bg-neutral-500/40 mx-auto my-6 animate-heroFadeInDelay" />

          {/* Subtitle */}
          <p className="text-xs md:text-sm font-medium uppercase text-neutral-600/70 dark:text-neutral-400/70 tracking-[0.3em] animate-heroFadeInDelay">
            Institutional Research for Everyone
          </p>

          {/* Description */}
          <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed animate-heroFadeInDelay2">
            Type any stock ticker. Get DCF valuations, moat analysis, and investment
            insights in seconds — powered by AI that thinks like a Wall Street analyst.
          </p>

          {/* CTA Button */}
          <div className="pt-8 animate-heroFadeInDelay3">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 px-10 py-4 overflow-hidden rounded-full bg-neutral-900 text-white shadow-2xl hover:shadow-xl transition-all duration-500 dark:bg-white dark:text-neutral-900"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-neutral-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-neutral-100 dark:to-white" />
              <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.25em] group-hover:tracking-[0.35em] transition-all duration-500">
                Begin Research
              </span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-[0.3em]">
              How It Works
            </span>
            <div className="h-[1px] w-10 bg-neutral-300/60 dark:bg-neutral-600/60 mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                icon: Search,
                step: "01",
                title: "Ask",
                description:
                  "Type any stock ticker or investment question. Our AI agent begins autonomous research immediately.",
              },
              {
                icon: BarChart3,
                step: "02",
                title: "Analyze",
                description:
                  "Real-time web search, financial data extraction, and DCF modeling — all performed by the AI in seconds.",
              },
              {
                icon: Shield,
                step: "03",
                title: "Decide",
                description:
                  "Receive a comprehensive research report with fair value estimates, risk analysis, and actionable insights.",
              },
            ].map((feature) => (
              <div key={feature.step} className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-neutral-400 dark:text-neutral-500" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
                  Step {feature.step}
                </span>
                <h3 className="font-serif text-2xl md:text-3xl tracking-tight text-neutral-800 dark:text-neutral-200 italic">
                  {feature.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-200/40 dark:border-neutral-800/40 py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
            TradvisorAI
          </span>
          <span className="text-[10px] text-neutral-400/60 dark:text-neutral-500/50 tracking-wider">
            AI analysis, not financial advice
          </span>
        </div>
      </footer>
    </div>
  );
}
