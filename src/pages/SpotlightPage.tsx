import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, 
  Quote, 
  Globe, 
  Twitter, 
  Linkedin, 
  UserCheck, 
  Calendar, 
  ShieldCheck, 
  Share2, 
  Check, 
  User 
} from "lucide-react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import { getSpotlightStoryById } from "../services/spotlightService";
import { getContributorById } from "../services/contributorService";
import { SpotlightStory, Contributor } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SpotlightPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<SpotlightStory | null>(null);
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      if (id) {
        const data = await getSpotlightStoryById(id);
        setStory(data);
        if (data?.contributorId) {
          try {
            const c = await getContributorById(data.contributorId);
            setContributor(c);
          } catch {
            // fallback
          }
        }
      }
      setLoading(false);
    };
    fetchStory();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-100 mb-8" />
          <div className="h-16 w-3/4 bg-slate-100 mb-6" />
          <div className="h-40 w-full bg-slate-50 mb-12" />
          <div className="aspect-16/9 bg-slate-100 mb-12" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-editorial font-bold mb-4">Spotlight Story Not Found</h1>
          <p className="text-slate-500 mb-8">The profile you are looking for has been removed or updated.</p>
          <Link to="/" className="bg-black text-white px-8 py-4 font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-colors">
            Return to Front Page
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const authorName = story.author || contributor?.name || "TechQuo Editorial Staff";
  const authorTitle = story.authorDesignation || contributor?.title || "Guest Contributor";
  const publishedByName = story.postedByName || "TechQuo News Editorial Team";
  const authorAvatar = contributor?.profileImage || contributor?.avatar || story.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=000&color=fff`;
  const authorSlug = contributor?.slug || authorName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  const authorProfileLink = `/contributors/${authorSlug}`;

  const formattedDate = story.publishedAt || story.createdAt 
    ? new Date(story.publishedAt || story.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Recent Feature';

  const cleanSnippet = (story.story || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const pageTitle = `${story.founderName}, Founder of ${story.companyName} | Founder Spotlight | TechQuo News`;
  const pageDescription = `${story.title}. How ${story.founderName} is building ${story.companyName}: ${cleanSnippet}`;
  const spotSlug = story.slug || story.id || id;
  const canonicalUrl = `https://techquonews.com/spotlight/${spotSlug}`;

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": story.title,
    "description": cleanSnippet,
    "image": [story.image],
    "datePublished": story.publishedAt || story.createdAt || new Date().toISOString(),
    "dateModified": story.updatedAt || story.publishedAt || story.createdAt || new Date().toISOString(),
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": `https://techquonews.com${authorProfileLink}`
    },
    "about": [
      {
        "@type": "Person",
        "name": story.founderName,
        "jobTitle": "Founder & Visionary",
        "worksFor": {
          "@type": "Organization",
          "name": story.companyName,
          "url": story.link || undefined
        }
      },
      {
        "@type": "Organization",
        "name": story.companyName,
        "url": story.link || undefined
      }
    ],
    "publisher": {
      "@type": "Organization",
      "name": publishedByName,
      "url": "https://techquonews.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://techquonews.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={story.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={story.image} />
        <script type="application/ld+json">
          {JSON.stringify(schemaJsonLd)}
        </script>
      </Helmet>

      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            to="/spotlights" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-accent transition-colors mb-12 uppercase text-[10px] font-bold tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Founder Spotlights
          </Link>

          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5">
              <div className="sticky top-40">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl">
                    <img 
                      src={story.image} 
                      alt={story.founderName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 bg-brand-accent text-white p-8 rounded-2xl shadow-xl">
                    <p className="editorial-label text-white/80 mb-2">Company</p>
                    <p className="text-xl font-bold">{story.companyName}</p>
                  </div>
                </motion.div>

                {/* Author / Reporter Spotlight Box */}
                <div className="mt-16 bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-4">
                  <span className="editorial-label text-slate-400 block text-[10px]">Reported & Written By</span>
                  <Link 
                    to={authorProfileLink}
                    className="flex items-center gap-3.5 group/author"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 group-hover/author:ring-2 group-hover/author:ring-brand-accent transition-all">
                      <img 
                        src={authorAvatar} 
                        alt={authorName} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 group-hover/author:text-brand-accent transition-colors flex items-center gap-1.5">
                        {authorName}
                        <UserCheck size={13} className="text-emerald-600" />
                      </p>
                      <p className="text-xs text-slate-500">{authorTitle}</p>
                    </div>
                  </Link>

                  <div className="pt-3 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-brand-accent shrink-0" />
                    <span>Published by <strong className="font-semibold text-slate-800">{publishedByName}</strong></span>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                   <h3 className="editorial-label text-brand-accent tracking-[0.3em] border-b border-slate-100 pb-4">Connect</h3>
                   <div className="flex gap-4">
                     {story.link && (
                       <a href={story.link} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all" title="Visit Website">
                         <Globe size={20} />
                       </a>
                     )}
                     <button 
                       onClick={handleShare}
                       className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all relative"
                       title="Share Spotlight Story"
                     >
                       {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                     </button>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="editorial-label text-brand-accent tracking-[0.3em] uppercase">Founder Spotlight</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {formattedDate}
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-editorial font-bold text-slate-900 mb-6 leading-tight">
                  {story.founderName}
                </h1>
                
                <h2 className="text-2xl md:text-3xl font-editorial font-bold text-brand-accent mb-8 italic border-l-4 border-brand-accent pl-8 py-2">
                  "{story.title}"
                </h2>

                {/* Inline Byline Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 mb-8 border-y border-slate-100 gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <Link 
                      to={authorProfileLink}
                      className="shrink-0 group/inline"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 group-hover/inline:border-brand-accent transition-all shadow-xs">
                        <img 
                          src={authorAvatar} 
                          alt={authorName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </Link>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-400">By</span>
                        <Link 
                          to={authorProfileLink}
                          className="text-base font-bold text-slate-900 group-hover/inline:text-brand-accent transition-colors flex items-center gap-1.5"
                        >
                          <span>{authorName}</span>
                          <UserCheck size={14} className="text-emerald-600" />
                        </Link>
                        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {authorTitle}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ShieldCheck size={13} className="text-brand-accent shrink-0" />
                        <span>Published by <strong className="font-semibold text-slate-800">{publishedByName}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                        <Calendar size={12} />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate lg:prose-xl max-w-none">
                  <div className="relative mb-12">
                    <Quote size={60} className="absolute -top-10 -left-10 text-brand-accent/10 -z-10" />
                    {story.story && /<[a-z][\s\S]*>/i.test(story.story) ? (
                      <div 
                        className="rich-text-content font-serif text-slate-800 leading-relaxed text-lg md:text-xl space-y-4"
                        dangerouslySetInnerHTML={{ 
                          __html: DOMPurify.sanitize(story.story, {
                            ADD_ATTR: ['target', 'rel', 'style', 'class', 'href', 'title', 'id'],
                            ADD_TAGS: ['iframe', 'span', 'mark', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'hr', 'strong', 'em', 'u', 's', 'code', 'pre', 'div', 'b', 'i']
                          }) 
                        }} 
                      />
                    ) : (
                      <div className="markdown-body font-serif text-slate-800 leading-relaxed text-lg md:text-xl whitespace-pre-wrap">
                        <ReactMarkdown>
                          {story.story || ""}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
