import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Building2, 
  Target, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  Award,
  ArrowRight
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const canonicalUrl = "https://www.techquonews.com/about";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>About TechQuo News | African Tech, FinTech & Startup Insights</title>
        <meta 
          name="description" 
          content="TechQuo News is the authoritative tech media platform reporting on African technology innovation, venture capital, fintech rails, and digital business developments." 
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="About TechQuo News" />
        <meta property="og:description" content="TechQuo News is the authoritative tech media platform reporting on African technology innovation and venture ecosystem." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About TechQuo News" />
        <meta name="twitter:description" content="TechQuo News is the authoritative tech media platform reporting on African technology innovation." />
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="mb-16 border-b border-slate-100 pb-12">
            <div className="flex items-center gap-2 text-brand-accent text-xs font-bold uppercase tracking-widest mb-4">
              <Building2 size={16} />
              <span>Editorial Network & Company</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-editorial font-bold text-slate-900 tracking-tight mb-6">
              Empowering Africa's Tech Ecosystem Through Rigorous Journalism<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-600 font-serif leading-relaxed max-w-3xl">
              TechQuo News delivers actionable journalism, deep market intelligence, and executive dispatches across Africa’s fastest-growing technology, venture finance, and digital infrastructure corridors.
            </p>
          </header>

          {/* Core Pillars */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <Target className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Our Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                To bridge the information gap across emerging African tech markets through deeply researched reporting, ethical analysis, and verifiable data.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <ShieldCheck className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Editorial Integrity</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every story undergoes rigorous fact-checking and independent evaluation. We maintain strict separation between sponsored collaborations and editorial independence.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <Globe className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Pan-African Scope</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                From Lagos and Nairobi to Cairo and Cape Town, our network surfaces high-impact founders, policy shifts, and investment trends shaping the continent.
              </p>
            </div>
          </div>

          {/* Section: Editorial Staff & Contributors */}
          <section className="mb-20">
            <div className="bg-slate-900 text-white p-10 sm:p-12 rounded-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-accent block">
                  Expert Network
                </span>
                <h2 className="text-3xl font-editorial font-bold">
                  Meet Our Columnists & Contributors
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Our reporting is powered by active cloud engineers, fintech leaders, ethical finance researchers, and investigative correspondents across the tech ecosystem.
                </p>
              </div>
              <Link 
                to="/contributors"
                className="bg-brand-accent text-white px-8 py-4 text-xs font-bold uppercase tracking-widest rounded hover:bg-orange-600 transition-colors shrink-0 flex items-center gap-2"
              >
                View Contributors Directory <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* Contact / Partnerships Callout */}
          <div className="border-t border-slate-200 pt-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h4 className="text-lg font-editorial font-bold text-slate-900">Have a news tip or press inquiry?</h4>
              <p className="text-xs text-slate-500 mt-1">Get in touch with our editorial and partnerships desk.</p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/contact" 
                className="px-6 py-3 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Contact Editorial
              </Link>
              <Link 
                to="/partnerships" 
                className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
