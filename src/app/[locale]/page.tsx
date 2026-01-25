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

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export default function LandingPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('landing');
  const tNav = useTranslations('landing.nav');
  const tHero = useTranslations('landing.hero');
  const tFeatures = useTranslations('landing.features');
  const tTestimonials = useTranslations('landing.testimonials');
  const tCta = useTranslations('landing.cta');
  const tFooter = useTranslations('landing.footer');

  const features = [
    {
      icon: FileText,
      title: tFeatures('items.invoicing.title'),
      description: tFeatures('items.invoicing.desc'),
    },
    {
      icon: BarChart3,
      title: tFeatures('items.reports.title'),
      description: tFeatures('items.reports.desc'),
    },
    {
      icon: Shield,
      title: tFeatures('items.reconciliation.title'),
      description: tFeatures('items.reconciliation.desc'),
    },
    {
      icon: Zap,
      title: tFeatures('items.ai.title'),
      description: tFeatures('items.ai.desc'),
    },
    {
      icon: Globe,
      title: tFeatures('items.multiLang.title'),
      description: tFeatures('items.multiLang.desc'),
    },
    {
      icon: Users,
      title: tFeatures('items.collaboration.title'),
      description: tFeatures('items.collaboration.desc'),
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
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-lg font-bold text-white">BL</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              BrownLedger
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-slate-600 hover:text-primary transition-colors">{tNav('features')}</Link>
            <Link href={`/${locale}/pricing`} className="text-slate-600 hover:text-primary transition-colors">{tNav('pricing')}</Link>
            <Link href="#testimonials" className="text-slate-600 hover:text-primary transition-colors">{tNav('testimonials')}</Link>
            <Link href={`/${locale === 'en' ? 'ar' : 'en'}`} className="flex items-center gap-1 text-slate-600 hover:text-primary transition-colors font-medium">
              <Globe className="w-4 h-4" />
              {locale === 'en' ? 'العربية' : 'English'}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href={`/${locale}/login`} className="text-slate-600 hover:text-primary transition-colors">
              {tNav('login')}
            </Link>
            <Link
              href={`/${locale}/auth/register`}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/30"
            >
              {tNav('startTrial')}
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
                {tHero('badge')}
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                {tHero('title')}{" "}
                <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {tHero('titleHighlight')}
                </span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                {tHero('description')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href={`/${locale}/auth/register`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-xl shadow-primary/30"
                >
                  {tHero('startTrial')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  <Play className="w-5 h-5" />
                  {tHero('watchDemo')}
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {tHero('trialDays')}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {tHero('noCard')}
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
          <p className="text-slate-500 mb-8">{t('trustedBy')}</p>
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
              {tFeatures('title')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {tFeatures('subtitle')}
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
              {tTestimonials('title')}
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
            {tCta('title')}
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            {tCta('subtitle')}
          </p>
          <Link
            href={`/${locale}/auth/register`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-xl shadow-primary/30"
          >
            {tCta('button')}
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
                {tFooter('description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tFooter('headers.product')}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#features">{tNav('features')}</Link></li>
                <li><Link href={`/${locale}/pricing`}>{tNav('pricing')}</Link></li>
                <li><Link href="#">{tFooter('links.integrations')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tFooter('headers.company')}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#">{tFooter('links.about')}</Link></li>
                <li><Link href="#">{tFooter('links.blog')}</Link></li>
                <li><Link href="#">{tFooter('links.careers')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{tFooter('headers.support')}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#">{tFooter('links.help')}</Link></li>
                <li><Link href="#">{tFooter('links.contact')}</Link></li>
                <li><Link href="#">{tFooter('links.privacy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            {tFooter('copyright', { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
