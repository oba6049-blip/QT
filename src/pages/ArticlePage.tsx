import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Share2, 
  Bookmark, 
  MessageSquare, 
  Check, 
  UserCheck, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { getArticleById } from "../services/articleService";
import { Article } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ArticlePage() {
  const { id, category: routeCategory, slug } = useParams<{ id?: string; category?: string; slug?: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      const lookupKey = slug || id;
      if (lookupKey) {
        const data = await getArticleById(lookupKey);
        setArticle(data);
      }
      setLoading(false);
    };
    fetchArticle();
    window.scrollTo(0, 0);
  }, [id, slug]);

  const handleShare = async () => {
    if (!article) return;
    
    const shareData = {
      title: article.title,
      text: article.excerpt,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-100 mb-8" />
          <div className="h-16 w-3/4 bg-slate-100 mb-6" />
          <div className="h-6 w-full bg-slate-50 mb-12" />
          <div className="aspect-16/9 bg-slate-100 mb-12" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-slate-50" />
            <div className="h-4 w-full bg-slate-50" />
            <div className="h-4 w-2/3 bg-slate-50" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-4xl font-editorial font-bold mb-4">Article Not Found</h1>
          <p className="text-slate-500 mb-8">The story you are looking for has been removed or archived.</p>
          <Link to="/" className="bg-black text-white px-8 py-4 font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-colors">
            Return to Front Page
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const contributor = article.contributor;
  const authorSlug = contributor?.slug || (article.author ? article.author.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : 'editorial-team');
  const authorProfileLink = `/contributors/${authorSlug}`;
  const authorAvatar = contributor?.profileImage || contributor?.avatar || article.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author)}&background=f1f5f9&color=000`;
  const authorTitle = contributor?.title || article.authorDesignation || 'Editorial Contributor';
  const authorBio = contributor?.bio || `Author and contributing journalist covering ${article.category || 'African technology'} at TechQuo News.`;

  const categorySlug = (article.category || routeCategory || "technology")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const articleSlug = article.slug || article.id;
  const canonicalUrl = `https://techquonews.com/${categorySlug || 'technology'}/${articleSlug}`;
  
  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "description": article.excerpt,
    "image": [article.image],
    "datePublished": article.publishedAt || article.createdAt || article.date,
    "dateModified": article.updatedAt || article.publishedAt || article.createdAt || article.date,
    "author": {
      "@type": "Person",
      "name": article.author,
      "url": `https://techquonews.com${authorProfileLink}`
    },
    "publisher": {
      "@type": "Organization",
      "name": "TechQuo News",
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
      <Navbar />
      
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      
      <Helmet>
        <title>{article.title} | TechQuo News</title>
        <meta name="description" content={article.excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={article.status === 'published' ? 'index, follow' : 'noindex, nofollow'} />
        <meta property="og:title" content={`${article.title} | TechQuo News`} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:image" content={article.image} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${article.title} | TechQuo News`} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.image} />
      </Helmet>
      
      <main className="pt-32 pb-24">
        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5 }}
            className="h-full bg-brand-accent"
          />
        </div>

        <article className="max-w-4xl mx-auto px-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-accent transition-colors mb-12 uppercase text-[10px] font-bold tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </Link>

          <header className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="bg-blue-50 text-brand-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">{article.category}</span>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <Clock size={14} />
                <span>{article.readTime}</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-editorial font-black leading-tight tracking-tight mb-8 text-slate-950">
              {article.title}
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 font-serif leading-relaxed italic border-l-4 border-brand-accent pl-8 py-2">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between mt-12 pt-8 border-t border-slate-100 gap-6">
              {/* Linked Author Byline */}
              <Link 
                to={authorProfileLink}
                className="flex items-center gap-4 group/author"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 group-hover/author:ring-2 group-hover/author:ring-brand-accent transition-all">
                   <img 
                     src={authorAvatar} 
                     alt={article.author} 
                     className="w-full h-full object-cover"
                     referrerPolicy="no-referrer"
                   />
                </div>
                <div>
                  <p className="font-bold text-base sm:text-lg leading-tight text-slate-900 group-hover/author:text-brand-accent transition-colors flex items-center gap-1.5">
                    {article.author}
                    <UserCheck size={14} className="text-emerald-600" />
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar size={12} />
                    {article.date} • <span className="font-medium">{authorTitle}</span>
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleShare}
                  className="p-3 border border-slate-200 text-slate-400 hover:text-brand-accent hover:border-brand-accent transition-all rounded-full flex items-center gap-2 relative group"
                  title="Share Story"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={18} />}
                  {copied && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                      Link Copied!
                    </span>
                  )}
                </button>
                <button className="p-3 border border-slate-200 text-slate-400 hover:text-brand-accent hover:border-brand-accent transition-all rounded-full">
                  <Bookmark size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="w-full aspect-16/9 bg-slate-100 mb-16 overflow-hidden rounded-lg shadow-2xl shadow-slate-200/50">
            <img 
              src={article.image} 
              alt={article.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
              }}
            />
          </div>

          <div className="prose prose-slate lg:prose-xl max-w-none font-serif leading-loose text-slate-800">
            {article.content?.startsWith('<') ? (
              <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} 
              />
            ) : (
              <div className="markdown-body">
                <ReactMarkdown>
                  {article.content || ""}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Dedicated "About the Author" Box */}
          <section className="mt-16 pt-10 border-t-2 border-slate-900">
            <div className="bg-slate-50 border border-slate-200 rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
              <Link to={authorProfileLink} className="shrink-0">
                <img
                  src={authorAvatar}
                  alt={article.author}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200 hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </Link>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent block">
                      About The Contributor
                    </span>
                    <h3 className="text-xl font-editorial font-bold text-slate-900">
                      <Link to={authorProfileLink} className="hover:text-brand-accent transition-colors">
                        {article.author}
                      </Link>
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {authorTitle}
                    </p>
                  </div>

                  {/* Social links */}
                  <div className="flex items-center gap-1.5">
                    {contributor?.socialLinks?.linkedin && (
                      <a
                        href={contributor.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-[#0077b5] flex items-center justify-center transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin size={13} />
                      </a>
                    )}
                    {contributor?.socialLinks?.twitter && (
                      <a
                        href={contributor.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-black flex items-center justify-center transition-colors"
                        title="X / Twitter"
                      >
                        <Twitter size={13} />
                      </a>
                    )}
                    {contributor?.socialLinks?.website && (
                      <a
                        href={contributor.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-brand-accent flex items-center justify-center transition-colors"
                        title="Website"
                      >
                        <Globe size={13} />
                      </a>
                    )}
                    {contributor?.showEmail && contributor?.email && (
                      <a
                        href={`mailto:${contributor.email}`}
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-white hover:bg-slate-900 flex items-center justify-center transition-colors"
                        title="Email"
                      >
                        <Mail size={13} />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {authorBio}
                </p>

                {contributor?.expertise && contributor.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {contributor.expertise.map((beat) => (
                      <span
                        key={beat}
                        className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-medium rounded"
                      >
                        {beat}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    to={authorProfileLink}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black hover:text-brand-accent transition-colors"
                  >
                    View All Articles by {article.author} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <footer className="mt-16 pt-12 border-t border-slate-100">
             <div className="bg-slate-50 p-12 rounded-2xl flex flex-col items-center text-center">
                <MessageSquare size={32} className="text-brand-accent mb-6" />
                <h3 className="text-2xl font-editorial font-bold mb-4">Join the Conversation</h3>
                <p className="text-slate-500 max-w-md mb-8">
                  What are your thoughts on this analysis? Connect with the community to discuss the implications of these developments.
                </p>
                <button className="bg-black text-white px-10 py-4 font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-colors">
                  Post a Comment
                </button>
             </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}

