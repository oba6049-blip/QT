import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getArticles } from "../services/articleService";
import { Article } from "../types";
import { Link } from "react-router-dom";

export default function FeaturedNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const data = await getArticles();
      setArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const featured = articles.find(a => a.featured);
  const others = articles.filter(a => !a.featured);

  if (loading && articles.length === 0) {
    return (
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-10 w-48 bg-slate-100 mb-4" />
          <div className="h-4 w-96 bg-slate-50 mb-16" />
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 bg-slate-50 aspect-16/9" />
            <div className="lg:col-span-4 space-y-8">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-50" />)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-slate-100 pb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-editorial font-bold mb-4">Inside the Industry</h2>
            <p className="text-slate-500 max-w-xl">Deep dives, investigative journalism, and analysis from our world-class team.</p>
          </div>
          <Link to="/trending" className="editorial-label text-brand-accent hover:text-black transition-colors uppercase font-bold tracking-widest text-[11px]">
            See All News
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-200 text-center rounded-lg">
            <p className="text-slate-500 font-serif italic text-lg mb-2">No articles published in the archive yet.</p>
            <p className="text-slate-400 text-xs">Articles created in the Editorial Dashboard will appear here immediately.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Main Featured */}
            {featured && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-8 group cursor-pointer"
              >
                <Link to={`/article/${featured.id}`} className="block border-none outline-none group">
                  <div className="relative overflow-hidden mb-8 border border-slate-100">
                    <img 
                      src={featured.image} 
                      alt={featured.title} 
                      className="w-full aspect-16/9 object-cover group-hover:scale-105 transition-transform duration-1000" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
                      }}
                    />
                    <div className="absolute top-6 left-6">
                      <span className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{featured.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="editorial-label text-brand-accent">Special Report</span>
                    <span className="text-slate-300">•</span>
                    <span className="editorial-label">{featured.readTime} read</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-editorial font-bold mb-6 group-hover:underline leading-tight text-black">
                    {featured.title}
                  </h3>
                  <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mb-8">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${featured.author}`} alt={featured.author} className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-black">{featured.author}</p>
                       <p className="text-xs text-slate-400">{featured.date} • {featured.authorDesignation || 'Contributor'}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Sidebar News */}
            <div className="lg:col-span-4 flex flex-col gap-10">
              {others.map((article, idx) => (
                <motion.div 
                  key={article.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer border-b border-slate-50 pb-8 last:border-0"
                >
                  <Link to={`/article/${article.id}`} className="block border-none outline-none">
                    <span className="editorial-label text-brand-accent mb-3 block">{article.category}</span>
                    <h4 className="font-bold text-xl leading-snug group-hover:underline mb-3">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{article.author}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
