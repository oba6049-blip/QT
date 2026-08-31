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
  Sparkles,
  Edit3,
  ShieldCheck
} from "lucide-react";
import { getArticleById } from "../services/articleService";
import { Article } from "../types";
import { useAuth } from "../lib/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SharePreviewModal from "../components/SharePreviewModal";

export default function ArticlePage() {
  const { user } = useAuth();
  const { id, category: routeCategory, slug } = useParams<{ id?: string; category?: string; slug?: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto pt-40 px-6 animate-pulse">
          <div className="h-4 w-24 bg-slate-100 mb-8" />
          <div className="h-16 w-3/4 bg-slate-100 mb-6" />
          <div className="h-6 w-full bg-slate-50 mb-12" />
          <div className="aspect-16/9 bg-slate-100 mb-12 rounded-md" />
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
  const authorAvatar = contributor?.profileImage || contributor?.avatar || article.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author)}&background=000&color=fff`;
  const authorTitle = article.authorDesignation || contributor?.title || 'Guest Contributor';
  const publishedByName = article.postedByName || 'TechQuo News Editorial Team';
  const authorBio = contributor?.bio || `Author and contributing journalist covering ${article.category || 'African technology and markets'} at TechQuo News.`;

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
        <meta property="og:image:secure_url" content={article.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@TechQuoNews" />
        <meta name="twitter:title" content={`${article.title} | TechQuo News`} />
        <meta name="twitter:description" content={article.excerpt} />
        <meta name="twitter:image" content={article.image} />
      </Helmet>
      
      {/* Social Share & Link Preview Modal */}
      <SharePreviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={article.title}
        description={article.excerpt || ""}
        url={canonicalUrl}
        image={article.image || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200"}
        type="article"
        categoryOrFounder={article.category}
        authorName={article.author}
      />
      
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

            <div className="flex flex-col md:flex-row md:items-center justify-between mt-12 pt-8 border-t border-slate-100 gap-6">
              {/* Linked Author Byline & Publishing Attribution */}
              <div className="flex items-start sm:items-center gap-4">
                <Link 
                  to={authorProfileLink}
                  className="shrink-0 group/author"
                >
                  <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-slate-200 group-hover/author:border-brand-accent group-hover/author:ring-2 group-hover/author:ring-brand-accent/20 transition-all shadow-xs">
                     <img 
                       src={authorAvatar} 
                       alt={article.author} 
                       className="w-full h-full object-cover"
                       referrerPolicy="no-referrer"
                     />
                  </div>
                </Link>
                
                <div className="space-y-1">
                  {/* Author Line */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">By</span>
                    <Link 
                      to={authorProfileLink}
                      className="font-bold text-base sm:text-lg text-slate-950 hover:text-brand-accent transition-colors flex items-center gap-1.5"
                    >
                      {article.author}
                      <UserCheck size={14} className="text-emerald-600" />
                    </Link>
                    <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {authorTitle}
                    </span>
                  </div>

                  {/* Published By Line */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck size={13} className="text-brand-accent shrink-0" />
                    <span>Published by <strong className="font-semibold text-slate-800">{publishedByName}</strong></span>
                  </div>

                  {/* Date & Read Time */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
                    <Calendar size={12} className="text-slate-400" />
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-center">
                {user && (
                  <Link
                    to={`/admin?edit=${article.id || (article as any)._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-black text-white hover:bg-brand-accent transition-colors rounded-full text-xs font-bold uppercase tracking-wider"
                    title="Edit this article in Admin Dashboard"
                  >
                    <Edit3 size={14} />
                    <span className="hidden sm:inline">Edit Story</span>
                  </Link>
                )}
                <button 
                  onClick={handleShare}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:text-brand-accent hover:border-brand-accent hover:bg-white transition-all rounded-full flex items-center gap-2 text-xs font-bold shadow-2xs group"
                  title="Share Article & Preview Social Card"
                >
                  <Share2 size={15} className="text-brand-accent group-hover:scale-110 transition-transform" />
                  <span>Share Story</span>
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
            {article.content && /<[a-z][\s\S]*>/i.test(article.content) ? (
              <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(article.content, {
                    ADD_ATTR: ['target', 'rel', 'style', 'class', 'href', 'title', 'id'],
                    ADD_TAGS: ['iframe', 'span', 'mark', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'hr', 'strong', 'em', 'u', 's', 'code', 'pre', 'div', 'b', 'i']
                  }) 
                }} 
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

                <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/60">
                  <Link
                    to={authorProfileLink}
                    className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black hover:text-brand-accent transition-colors"
                  >
                    View All Articles by {article.author} <ArrowRight size={13} />
                  </Link>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-brand-accent shrink-0" />
                    <span>Published & Verified by <strong className="font-semibold text-slate-800">{publishedByName}</strong></span>
                  </div>
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

