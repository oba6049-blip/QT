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
  PhoneCall,
  Loader2,
  AlertCircle
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkjnjbgl";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "Editorial Tip", message: "" });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          _replyto: form.email,
          subject: form.subject,
          _subject: `[TechQuo News] ${form.subject} - ${form.name}`,
          message: form.message
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", subject: "Editorial Tip", message: "" });
      } else {
        if (data && data.errors && data.errors.length > 0) {
          setError(data.errors.map((err: any) => err.message).join(", "));
        } else {
          setError("There was a problem delivering your message. Please try again or email editorial@techquonews.com directly.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Network error while connecting to the newsroom dispatch. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const canonicalUrl = "https://www.techquonews.com/contact";

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
                    <span className="text-[11px] font-bold uppercase text-brand-accent block mb-1">Editorial Desk & News Tips</span>
                    <div className="space-y-0.5">
                      <a href="mailto:editorial@techquonews.com" className="block text-sm font-medium text-slate-800 hover:text-brand-accent transition-colors">
                        editorial@techquonews.com
                      </a>
                      <a href="mailto:editor@quotientsafrica.com" className="block text-sm font-medium text-slate-800 hover:text-brand-accent transition-colors">
                        editor@quotientsafrica.com
                      </a>
                    </div>
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
                  <h3 className="text-2xl font-editorial font-bold text-slate-900">Message Delivered</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting TechQuo News. Your dispatch has been transmitted to our editorial desk and our team will review it promptly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setError(null);
                    }}
                    className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-black transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={handleSubmit}
                  action={FORMSPREE_ENDPOINT}
                  method="POST"
                  className="bg-white border border-slate-200 p-8 sm:p-10 rounded-sm space-y-6 shadow-2xs"
                >
                  <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">Send an Inquiry</h3>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Unable to dispatch message</p>
                        <p className="mt-0.5">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Your Name
                      </label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        disabled={loading}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Nurudeen Adewale"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        disabled={loading}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Department / Reason
                    </label>
                    <select 
                      name="subject"
                      value={form.subject}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                    >
                      <option value="Partnerships & Brand Sponsorships">Partnerships & Brand Sponsorships</option>
                      <option value="Editorial Tip">News Tip / Story Pitch</option>
                      <option value="Op-Ed Submission">Op-Ed & Contributor Submission</option>
                      <option value="Media Kit & Advertising Request">Media Kit & Advertising Request</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Message Details
                    </label>
                    <textarea 
                      name="message"
                      rows={5}
                      required
                      disabled={loading}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Share your press release, inquiry, or confidential story outline..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black resize-none disabled:opacity-60"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black hover:bg-brand-accent disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transmitting to Newsroom...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Submit Message to TechQuo News
                      </>
                    )}
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
