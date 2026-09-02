import React, { useEffect, useState, useRef } from "react";
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
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Users,
  BarChart3,
  Globe2,
  FileText,
  Clock,
  Phone,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkjnjbgl";

interface PartnershipFormState {
  fullName: string;
  email: string;
  company: string;
  jobTitle: string;
  phone: string;
  partnershipType: string;
  timeline: string;
  requestMediaKit: boolean;
  message: string;
}

const initialFormState: PartnershipFormState = {
  fullName: "",
  email: "",
  company: "",
  jobTitle: "",
  phone: "",
  partnershipType: "Sponsored Content & Narrative Reports",
  timeline: "Next 1-3 Months",
  requestMediaKit: true,
  message: "",
};

const partnershipOptions = [
  "Sponsored Content & Narrative Reports",
  "Executive Spotlight & Video/Audio Series",
  "Event & Conference Summit Headline Partner",
  "Newsletter & Daily Brief Sponsorship",
  "Display Advertising & Homepage Takeovers",
  "Custom Media Kit & Rate Card Request",
  "Long-term Brand Ambassador / Enterprise Retainer"
];

const timelineOptions = [
  "Immediate (Within 30 days)",
  "Next 1-3 Months",
  "Next 3-6 Months",
  "Upcoming Tech Conference / Event Date",
  "Flexible / Exploring Options"
];

export default function PartnershipsPage() {
  const [form, setForm] = useState<PartnershipFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToForm = (prefillType?: string) => {
    if (prefillType) {
      setForm((prev) => ({ ...prev, partnershipType: prefillType }));
    }
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
          fullName: form.fullName,
          email: form.email,
          _replyto: form.email,
          company: form.company,
          jobTitle: form.jobTitle,
          phone: form.phone || "Not provided",
          partnershipType: form.partnershipType,
          timeline: form.timeline,
          requestMediaKit: form.requestMediaKit ? "Yes" : "No",
          subject: `[Partnership Inquiry] ${form.company} - ${form.partnershipType}`,
          _subject: `[TechQuo Partnerships] ${form.company} - ${form.fullName}`,
          message: form.message
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSubmitted(true);
        setForm(initialFormState);
      } else {
        if (data && data.errors && data.errors.length > 0) {
          setError(data.errors.map((err: any) => err.message).join(", "));
        } else {
          setError("Failed to transmit partnership inquiry. Please try again or email partnerships@techquonews.com directly.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Network connection error while contacting the partnerships desk.");
    } finally {
      setLoading(false);
    }
  };

  const canonicalUrl = "https://www.techquonews.com/partnerships";

  const faqs = [
    {
      q: "What types of companies partner with TechQuo News?",
      a: "We work with venture-backed tech startups, multinational cloud/enterprise leaders, venture capital funds, fintech platforms, telcos, and developer tools companies looking to expand their presence across Africa and global emerging tech corridors."
    },
    {
      q: "How fast will the partnerships team respond?",
      a: "Our brand partnerships desk reviews all submissions and typically responds within 24 business hours with our rate card, audience demographic breakdown, and customized package proposals."
    },
    {
      q: "Can we request custom multi-channel campaigns?",
      a: "Yes. In addition to standard placements, we produce custom whitepapers, bespoke founder documentary shorts, conference lounge stages, and co-branded webinar series tailored to your brand's growth goals."
    },
    {
      q: "Are editorial standards maintained for sponsored content?",
      a: "All sponsored stories and partner collaborations are labeled transparently according to global journalistic ethics, ensuring strong reader trust while showcasing your authentic technology story."
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-brand-accent selection:text-white">
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
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* Header Hero */}
          <header className="mb-16 border-b border-slate-100 pb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-brand-accent text-xs font-bold uppercase tracking-widest rounded-full">
                <Sparkles size={13} /> Strategic Media & Brand Solutions
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-editorial font-bold text-slate-900 tracking-tight mb-6">
              Connect With Africa's Most Influential Tech Leaders<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 font-serif leading-relaxed max-w-3xl mb-8">
              TechQuo News delivers native journalism, sponsored executive spotlights, podcast integrations, and conference brand activations reaching founders, venture capitalists, policy architects, and engineers.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => scrollToForm()}
                className="bg-black hover:bg-brand-accent text-white px-8 py-4 text-xs font-bold uppercase tracking-widest rounded transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Mail size={16} /> Contact Partnerships Team
              </button>
              <a 
                href="mailto:partnerships@techquonews.com?subject=TechQuo%20News%20Media%20Kit%20Request"
                className="px-6 py-4 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-widest rounded hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
              >
                <FileText size={15} /> Request 2026 Media Kit
              </a>
            </div>
          </header>

          {/* Audience Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Users size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Monthly Readers</span>
              </div>
              <div className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900">185K+</div>
              <p className="text-xs text-slate-500 mt-1">Founders, CXOs & tech talent</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Mail size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Newsletter Subscribers</span>
              </div>
              <div className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900">42K+</div>
              <p className="text-xs text-slate-500 mt-1">48.2% average open rate</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <BarChart3 size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Decision Makers</span>
              </div>
              <div className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900">68%</div>
              <p className="text-xs text-slate-500 mt-1">C-Suite, VP & Director level</p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-sm">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Globe2 size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Regional Coverage</span>
              </div>
              <div className="text-3xl sm:text-4xl font-editorial font-bold text-slate-900">24+</div>
              <p className="text-xs text-slate-500 mt-1">Key tech hubs across Africa & Diaspora</p>
            </div>
          </div>

          {/* Offerings Grid */}
          <div className="mb-24">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-10 pb-4 border-b border-slate-200 gap-4">
              <div>
                <span className="text-brand-accent text-xs font-bold uppercase tracking-widest block mb-1">
                  Partnership Pillars
                </span>
                <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-slate-900">
                  Tailored Brand Solutions
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">
                Click any solution below to auto-select and start your partnership inquiry.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm flex flex-col justify-between hover:border-slate-400 transition-all group">
                <div>
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center text-brand-accent mb-6 shadow-2xs group-hover:scale-105 transition-transform">
                    <Layers size={24} />
                  </div>
                  <h3 className="text-xl font-editorial font-bold text-slate-900 mb-3">Sponsored Content & Analysis</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Co-produce in-depth case studies, product teardowns, and market narrative reports on your company’s technology stack and market milestones.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToForm("Sponsored Content & Narrative Reports")}
                  className="text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent flex items-center gap-2 group-hover:translate-x-1 transition-all pt-4 border-t border-slate-200 text-left"
                >
                  Inquire for Sponsored Deep Dives <ArrowRight size={13} />
                </button>
              </div>

              <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm flex flex-col justify-between hover:border-slate-400 transition-all group">
                <div>
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center text-brand-accent mb-6 shadow-2xs group-hover:scale-105 transition-transform">
                    <Radio size={24} />
                  </div>
                  <h3 className="text-xl font-editorial font-bold text-slate-900 mb-3">Executive Spotlight Series</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Feature your C-suite executives, general partners, and technical leads in high-production multimedia interviews distributed globally.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToForm("Executive Spotlight & Video/Audio Series")}
                  className="text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent flex items-center gap-2 group-hover:translate-x-1 transition-all pt-4 border-t border-slate-200 text-left"
                >
                  Book an Executive Spotlight <ArrowRight size={13} />
                </button>
              </div>

              <div className="p-8 bg-slate-50 border border-slate-200 rounded-sm flex flex-col justify-between hover:border-slate-400 transition-all group">
                <div>
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center text-brand-accent mb-6 shadow-2xs group-hover:scale-105 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-xl font-editorial font-bold text-slate-900 mb-3">Event & Conference Summits</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Headline partner branding, live keynote broadcasting, VIP media lounge activations, and investor mixers at flagship technology summits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToForm("Event & Conference Summit Headline Partner")}
                  className="text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent flex items-center gap-2 group-hover:translate-x-1 transition-all pt-4 border-t border-slate-200 text-left"
                >
                  Partner on Upcoming Events <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Form & Direct Contact Section */}
          <div ref={formRef} id="partnership-form" className="scroll-mt-36 grid md:grid-cols-12 gap-12 mb-24">
            {/* Left Column: Direct Info & Why Partner */}
            <div className="md:col-span-5 space-y-8">
              <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-sm space-y-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent block">
                  Direct Partnerships Desk
                </span>
                <h3 className="text-2xl font-editorial font-bold">
                  Let’s Build a Custom Campaign Together
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Fill out this brief or contact our commercial partnership directors directly. We'll tailor a media solution with clear performance deliverables.
                </p>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">General Partnerships Email</span>
                      <a href="mailto:partnerships@techquonews.com" className="text-sm font-medium text-white hover:text-brand-accent transition-colors">
                        partnerships@techquonews.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={18} className="text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Guaranteed Response Time</span>
                      <span className="text-sm font-medium text-white">Within 24 Business Hours</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Headquarters</span>
                      <span className="text-xs text-slate-300">Lagos • Nairobi • London • San Francisco</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: The Partnerships Form */}
            <div className="md:col-span-7">
              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-10 rounded-sm text-center space-y-5 shadow-2xs">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-2xl font-editorial font-bold text-slate-900">
                    Partnership Request Received!
                  </h3>
                  <p className="text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to the TechQuo News Partnerships Team. Our commercial lead has been notified and will be in touch within 24 hours with our complete 2026 media kit and custom options.
                  </p>
                  <div className="pt-4 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setError(null);
                      }}
                      className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded hover:bg-brand-accent transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                    <Link
                      to="/"
                      className="px-6 py-3 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-widest rounded hover:bg-slate-100 transition-colors"
                    >
                      Return to Homepage
                    </Link>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  action={FORMSPREE_ENDPOINT}
                  method="POST"
                  className="bg-white border border-slate-200 p-8 sm:p-10 rounded-sm space-y-6 shadow-sm"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent block mb-1">
                      Commercial Inquiry Form
                    </span>
                    <h3 className="text-2xl font-editorial font-bold text-slate-900">
                      Contact Partnerships Team
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tell us about your organization and marketing objectives.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Unable to transmit inquiry</p>
                        <p className="mt-0.5">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Name and Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        disabled={loading}
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="e.g. Nurudeen Adewale"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Work / Corporate Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        disabled={loading}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Company and Job Title */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Company / Brand Name *
                      </label>
                      <input
                        type="text"
                        name="company"
                        required
                        disabled={loading}
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Flutterwave, Paystack, Microsoft"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Job Title / Designation
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        disabled={loading}
                        value={form.jobTitle}
                        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                        placeholder="e.g. Head of Marketing, VP Growth"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Phone and Timeline */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        disabled={loading}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Target Timeline
                      </label>
                      <select
                        name="timeline"
                        value={form.timeline}
                        disabled={loading}
                        onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black disabled:opacity-60"
                      >
                        {timelineOptions.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Partnership Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Partnership Interest *
                    </label>
                    <select
                      name="partnershipType"
                      value={form.partnershipType}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, partnershipType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium disabled:opacity-60"
                    >
                      {partnershipOptions.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Campaign Goals & Project Details *
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      required
                      disabled={loading}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Share your campaign objectives, target audience, launch milestones, or specific deliverables..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black leading-relaxed resize-none disabled:opacity-60"
                    />
                  </div>

                  {/* Media Kit Checkbox */}
                  <label className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      name="requestMediaKit"
                      checked={form.requestMediaKit}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, requestMediaKit: e.target.checked })}
                      className="w-4 h-4 text-brand-accent rounded border-slate-300 focus:ring-brand-accent"
                    />
                    <span className="text-xs font-medium text-slate-800">
                      Send me the full <strong>TechQuo News 2026 Media Kit & Rate Card PDF</strong> along with response.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black hover:bg-brand-accent disabled:bg-slate-400 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Transmitting to Partnerships Desk...
                      </>
                    ) : (
                      <>
                        <Send size={15} /> Send Partnership Inquiry to TechQuo News
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Direct confidential dispatch • No spam guarantee
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* FAQ Accordion */}
          <section className="border-t border-slate-200 pt-16 mb-16">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <span className="text-brand-accent text-xs font-bold uppercase tracking-widest block mb-2">
                  Frequently Asked Questions
                </span>
                <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-slate-900">
                  Partnership Details & Guidelines
                </h2>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div 
                      key={idx}
                      className="border border-slate-200 rounded-sm overflow-hidden bg-slate-50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-sm font-bold text-slate-900 font-editorial">
                          {faq.q}
                        </span>
                        <ChevronDown 
                          size={18} 
                          className={`text-slate-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-brand-accent" : ""}`} 
                        />
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
