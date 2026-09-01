import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { getTrendingArticles } from "../services/articleService";
import { Article } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { TrendingUp, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";

export default function TrendingPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const data = await getTrendingArticles();
      setArticles(data);
      setLoading(false);
    };
    fetchArticles();
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Trending Tech News & Market Stories | TechQuo News</title>
        <meta name="description" content="The stories currently dominating the conversation across African technology, fintech, venture capital, and startups." />
        <link rel="canonical" href="https://www.techquonews.com/trending" />
        <meta property="og:title" content="Trending Tech News & Market Stories | TechQuo News" />
        <meta property="og:description" content="The stories currently dominating the conversation across African technology, fintech, venture capital, and startups." />
        <meta property="og:url" content="https://www.techquonews.com/trending" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="mb-20 border-b border-slate-100 pb-12 relative">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                    <TrendingUp size={20} />
                </div>
                <span className="editorial-label text-brand-accent">Real-time Analytics</span>
             </div>
            <h1 className="text-6xl md:text-8xl font-editorial font-bold mb-6 tracking-tight">
              Trending Now<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
              The stories currently dominating the conversation across the global TechQuo News network.
            </p>
          </header>

          {loading ? (
             <div className="space-y-12 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-slate-50 border border-slate-100" />
                ))}
             </div>
          ) : articles.length > 0 ? (
            <div className="grid gap-12 lg:gap-16">
              {articles.map((article, idx) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  className="block outline-none"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group flex flex-col md:flex-row gap-8 md:gap-12 p-8 md:p-12 bg-white border border-slate-100 hover:border-brand-accent/30 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="text-4xl md:text-6xl font-editorial font-black text-slate-100 group-hover:text-brand-accent/10 transition-colors absolute top-4 right-8">
                      {String(idx + 1).padStart(2, '0')}
                    </div>

                    <div className="md:w-1/3 aspect-16/9 md:aspect-4/3 overflow-hidden bg-slate-100 shrink-0 rounded-md">
                      <img 
                        src={article.image} 
                        alt={article.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1.5 text-brand-accent">
                              <Flame size={14} />
                              <span className="editorial-label text-[10px]">Viral Story</span>
                          </div>
                          <span className="text-slate-300">•</span>
                          <span className="editorial-label text-[10px] uppercase">{article.category}</span>
                      </div>

                      <h2 className="text-3xl md:text-4xl font-editorial font-bold mb-6 group-hover:underline leading-tight text-black">
                        {article.title}
                      </h2>
                      
                      <p className="text-slate-600 mb-8 text-base leading-relaxed line-clamp-2 max-w-2xl">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-3">
                              <img src={`https://ui-avatars.com/api/?name=${article.author}`} alt={article.author} className="w-8 h-8 rounded-full" />
                              <div>
                                  <p className="text-xs font-bold text-black">{article.author}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{article.date} • {article.authorDesignation || 'Contributor'}</p>
                              </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 text-brand-accent overflow-hidden group">
                             <span className="text-[10px] font-bold uppercase tracking-widest translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">Read Entire Dispatch</span>
                             <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                          </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-200">
              <p className="text-slate-400 font-serif italic text-xl">No trending dispatches at this hour.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
