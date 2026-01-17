"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  FileText,
  Users,
  Shield,
  Zap,
  Globe,
  Smartphone,
  Star,
  Play,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: FileText,
      title: "Professional Invoicing",
      description: "Create beautiful invoices in seconds. Track payments and send automatic reminders.",
    },
    {
      icon: BarChart3,
      title: "Financial Reports",
      description: "IFRS-compliant Balance Sheet, Income Statement, and Cash Flow reports.",
    },
    {
      icon: Shield,
      title: "Bank Reconciliation",
      description: "Match bank transactions with your books automatically.",
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Get smart suggestions and predictions powered by artificial intelligence.",
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Full Arabic and English support with RTL interface.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite your accountant, bookkeeper, or team members with role-based access.",
    },
  ];

  const testimonials = [
    {
      name: "Ahmed Hassan",
      company: "Cairo Trading Co.",
      text: "BrownLedger transformed how we manage our finances. The Arabic support is perfect!",
      rating: 5,
    },
    {
      name: "Sara Mohamed",
      company: "Nile Consulting",
      text: "Finally, an accounting software that understands Egyptian business needs.",
      rating: 5,
    },
    {
      name: "Omar Farid",
      company: "Delta Tech",
      text: "The AI features save us hours every week. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-lg font-bold text-white">BL</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              BrownLedger
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-slate-600 hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="text-slate-600 hover:text-primary transition-colors">Pricing</Link>
            <Link href="#testimonials" className="text-slate-600 hover:text-primary transition-colors">Testimonials</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-600 hover:text-primary transition-colors">
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/30"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Accounting for Egypt
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                Modern Accounting for{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Modern Business
                </span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                The only accounting software built specifically for Egyptian businesses.
                IFRS-compliant, Arabic interface, and ETA e-invoicing ready.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-xl shadow-primary/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Free 14-day trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="h-8 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 px-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                      <p className="text-sm opacity-80">Revenue</p>
                      <p className="text-2xl font-bold">£125,000</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      <p className="text-sm opacity-80">Invoices</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white">
                      <p className="text-sm opacity-80">Clients</p>
                      <p className="text-2xl font-bold">156</p>
                    </div>
                  </div>
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-end p-4 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-primary to-blue-500 rounded-t"
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 px-6 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 mb-8">Trusted by 500+ Egyptian businesses</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {["Cairo Trade", "Nile Group", "Delta Corp", "Pharos Inc", "Sphinx LLC"].map((name) => (
              <div key={name} className="text-2xl font-bold text-slate-400">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything you need to manage your finances
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed for Egyptian businesses, from invoicing to financial reporting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Loved by businesses across Egypt
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  "{t.text}"
                </p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to modernize your accounting?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Join 500+ Egyptian businesses already using BrownLedger
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/30"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white">BL</span>
                </div>
                <span className="font-bold">BrownLedger</span>
              </div>
              <p className="text-sm text-slate-500">
                Modern accounting software for Egyptian businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="#">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#">About</Link></li>
                <li><Link href="#">Blog</Link></li>
                <li><Link href="#">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#">Help Center</Link></li>
                <li><Link href="#">Contact</Link></li>
                <li><Link href="#">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} BrownLedger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
