import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Mail, 
  MapPin, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  PhoneCall
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "Editorial Tip", message: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const canonicalUrl = "https://techquonews.com/contact";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Helmet>
        <title>Contact Us | TechQuo News</title>
        <meta 
          name="description" 
          content="Get in touch with TechQuo News editorial newsroom, press team, and corporate headquarters for news tips, op-ed submissions, and inquiries." 
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Contact TechQuo News" />
        <meta property="og:description" content="Reach out to the TechQuo News editorial desk, investigative reporters, and media relations team." />
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
              Direct Newsroom Dispatch
            </span>
            <h1 className="text-4xl sm:text-6xl font-editorial font-bold text-slate-900 tracking-tight mb-6">
              Contact TechQuo News<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-600 font-serif leading-relaxed max-w-2xl">
              We welcome news tips, whistleblower leads, op-ed submissions, and reader inquiries from across the global technology ecosystem.
            </p>
          </header>

          <div className="grid md:grid-cols-12 gap-12">
            {/* Contact Information Column */}
            <div className="md:col-span-5 space-y-8">
              <div className="bg-slate-50 p-8 border border-slate-200 rounded-sm space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-3">
                  Department Contacts
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-brand-accent block">Editorial Desk & News Tips</span>
                    <a href="mailto:editorial@techquonews.com" className="text-sm font-medium text-slate-800 hover:text-brand-accent transition-colors">
                      editorial@techquonews.com
                    </a>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-brand-accent block">Press & Media Relations</span>
                    <a href="mailto:press@techquonews.com" className="text-sm font-medium text-slate-800 hover:text-brand-accent transition-colors">
                      press@techquonews.com
                    </a>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase text-brand-accent block">Partnerships & Sponsorships</span>
                    <a href="mailto:partnerships@techquonews.com" className="text-sm font-medium text-slate-800 hover:text-brand-accent transition-colors">
                      partnerships@techquonews.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 text-white rounded-sm space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent block">
                  Secure Whistleblower Channel
                </span>
                <h4 className="text-base font-editorial font-bold">Have a confidential tech lead?</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Our investigative journalists protect sources with strict cryptographic confidentiality. Mark subject as [CONFIDENTIAL LEAD].
                </p>
              </div>
            </div>

            {/* Message Form Column */}
            <div className="md:col-span-7">
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-sm text-center space-y-4">
                  <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
                  <h3 className="text-2xl font-editorial font-bold text-slate-900">Message Received</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting TechQuo News. Our editorial team will review your message and reply promptly if required.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-black transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-8 sm:p-10 rounded-sm space-y-6 shadow-2xs">
                  <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Send an Inquiry</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Your Name
                      </label>
                      <input 
                        type="text" 
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Nurudeen Adewale"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Department / Reason
                    </label>
                    <select 
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
                    >
                      <option value="Editorial Tip">News Tip / Story Pitch</option>
                      <option value="Op-Ed Submission">Op-Ed & Contributor Submission</option>
                      <option value="Advertising">Advertising & Brand Campaign</option>
                      <option value="General">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Message Details
                    </label>
                    <textarea 
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Share your press release, inquiry, or confidential story outline..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-black hover:bg-brand-accent text-white text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Submit Message to TechQuo News
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
