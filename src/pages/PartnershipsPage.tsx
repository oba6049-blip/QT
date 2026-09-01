import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Briefcase, 
  TrendingUp, 
  Layers, 
  Radio, 
  Sparkles, 
  Award,
  ArrowRight,
  Mail
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PartnershipsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const canonicalUrl = "https://www.techquonews.com/partnerships";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>Partnerships & Advertising | TechQuo News</title>
        <meta 
          name="description" 
          content="Partner with TechQuo News to reach high-impact decision makers, tech founders, venture capitalists, and software engineers across Africa and globally." 
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Partnerships & Advertising | TechQuo News" />
        <meta property="og:description" content="Reach decision makers, tech founders, venture capitalists, and software engineers with TechQuo News advertising solutions." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="mb-16 border-b border-slate-100 pb-12">
            <span className="text-brand-accent text-xs font-bold uppercase tracking-widest block mb-4">
              Strategic Media & Brand Solutions
            </span>
            <h1 className="text-4xl sm:text-6xl font-editorial font-bold text-slate-900 tracking-tight mb-6">
              Connect With African Tech Leaders<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-600 font-serif leading-relaxed max-w-3xl">
              TechQuo News provides bespoke native reporting, sponsored executive spotlights, podcast integrations, and conference brand activations targeted at senior leaders across the pan-African technology corridor.
            </p>
          </header>

          {/* Offerings Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <Layers className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Sponsored Content & Analysis</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Co-produce in-depth case studies, whitepapers, and narrative reports on your company’s technology stack, product milestones, and market impact.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <Radio className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Executive Spotlight Series</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Feature your C-suite executives and venture partners in high-production video and written interviews distributed across our global feeds.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm">
              <TrendingUp className="text-brand-accent mb-4" size={28} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Event & Conference Summits</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Headline partner branding, live keynote broadcasting, and media lounge activations at our flagship tech conferences and investor mixers.
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-slate-900 text-white p-10 sm:p-12 rounded-sm text-center max-w-3xl mx-auto space-y-6">
            <Briefcase className="text-brand-accent mx-auto" size={40} />
            <h2 className="text-3xl font-editorial font-bold">
              Request the TechQuo News Media Kit
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore audience demographics, traffic metrics, past case studies, and flexible sponsorship packages tailored for your brand growth.
            </p>
            <div className="pt-2 flex justify-center">
              <a 
                href="mailto:partnerships@techquonews.com?subject=TechQuo%20News%20Media%20Kit%20Request"
                className="bg-brand-accent hover:bg-orange-600 text-white px-8 py-4 text-xs font-bold uppercase tracking-widest rounded transition-colors inline-flex items-center gap-2"
              >
                <Mail size={16} /> Contact Partnerships Team
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
