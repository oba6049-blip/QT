import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "motion/react";
import { getArticlesByCategory } from "../services/articleService";
import { Article } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Clock, ArrowRight } from "lucide-react";

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const cleanCategory = (category || "technology")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const displayCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1);
  const canonicalUrl = `https://www.techquonews.com/${cleanCategory}`;
  const pageTitle = `${displayCategory} News & Analysis | TechQuo News`;
  const pageDescription = `Read the latest ${displayCategory} news, tech market insights, startup rounds, and industry analysis on TechQuo News.`;

  useEffect(() => {
    if (category) {
      const fetchArticles = async () => {
        setLoading(true);
        const data = await getArticlesByCategory(category);
        setArticles(data);
        setLoading(false);
      };
      fetchArticles();
      window.scrollTo(0, 0);
    }
  }, [category]);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <Navbar />
      <main className="min-h-screen pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Header */}
          <header className="mb-20 border-b border-slate-100 pb-12">
            <span className="editorial-label text-brand-accent mb-4 block">Archive Directory</span>
            <h1 className="text-6xl md:text-8xl font-editorial font-bold mb-6 tracking-tight">
              {displayCategory}<span className="text-brand-accent">.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
              Curated analysis, news, and market insights on the latest trends in {displayCategory}.
            </p>
          </header>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <div className="bg-slate-50 aspect-video rounded-md" />
                  <div className="h-6 bg-slate-50 w-3/4 rounded" />
                  <div className="h-4 bg-slate-50 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-x-16 lg:gap-y-24">
              {articles.map((article, idx) => {
                const artCat = (article.category || cleanCategory)
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-");
                const artSlug = article.slug || article.id;
                return (
                  <Link
                    key={article.id}
                    to={`/${artCat}/${artSlug}`}
                    className="block outline-none"
                  >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div className="overflow-hidden mb-6 border border-slate-50 aspect-16/9 bg-slate-100 rounded-md">
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
                    <div className="flex items-center gap-4 mb-4">
                      <span className="editorial-label text-brand-accent">Editorial</span>
                      <span className="text-slate-300">•</span>
                      <span className="editorial-label">{article.readTime} read</span>
                    </div>
                    <h3 className="text-2xl font-editorial font-bold mb-4 group-hover:underline leading-tight text-black">
                      {article.title}
                    </h3>
                    <p className="text-slate-600 line-clamp-3 mb-6 text-sm leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-xs font-bold text-black">{article.author}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{article.date}</p>
                      </div>
                      <ArrowRight size={18} className="text-slate-200 group-hover:text-brand-accent group-hover:translate-x-2 transition-all" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-slate-200">
              <p className="text-slate-400 font-serif italic text-xl">No stories currently circulating in this dispatch.</p>
              <Link to="/" className="inline-block mt-8 editorial-label text-brand-accent hover:underline">Return to Main Hub</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
