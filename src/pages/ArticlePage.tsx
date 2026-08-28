import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { ArrowLeft, Clock, Calendar, Share2, Bookmark, MessageSquare, Check } from "lucide-react";
import { getArticleById } from "../services/articleService";
import { Article } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (id) {
        const data = await getArticleById(id);
        setArticle(data);
      }
      setLoading(false);
    };
    fetchArticle();
    window.scrollTo(0, 0);
  }, [id]);

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {article && (
        <Helmet>
          <title>{article.title} | Quotient Africa</title>
          <meta name="description" content={article.excerpt} />
          <meta property="og:title" content={article.title} />
          <meta property="og:description" content={article.excerpt} />
          <meta property="og:image" content={article.image} />
          <meta name="twitter:title" content={article.title} />
          <meta name="twitter:description" content={article.excerpt} />
          <meta name="twitter:image" content={article.image} />
        </Helmet>
      )}
      
      <main className="pt-32 pb-24">
        {/* Progress Bar (Visual only for now) */}
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

            <h1 className="text-5xl md:text-7xl font-editorial font-black leading-tight tracking-tight mb-8">
              {article.title}
            </h1>

            <p className="text-2xl text-slate-600 font-serif leading-relaxed italic border-l-4 border-brand-accent pl-8 py-2">
              {article.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-between mt-12 pt-8 border-t border-slate-100 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                   <img src={`https://ui-avatars.com/api/?name=${article.author}&background=f1f5f9&color=000`} alt="Author" />
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{article.author}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {article.date} • {article.authorDesignation || 'Contributor'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleShare}
                  className="p-3 border border-slate-200 text-slate-400 hover:text-brand-accent hover:border-brand-accent transition-all rounded-full flex items-center gap-2 relative group"
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
                // Fallback to high-res editorial placeholder if image fails
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

          <footer className="mt-24 pt-12 border-t border-slate-100">
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
