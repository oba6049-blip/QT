import { motion } from "motion/react";
import { ArrowRight, ChevronRight, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getArticles } from "../services/articleService";
import { getEvents } from "../services/eventService";
import { Article, NewsEvent } from "../types";
import { Link, useNavigate } from "react-router-dom";

export default function Hero() {
  const [featured, setFeatured] = useState<Article | null>(null);
  const [trending, setTrending] = useState<Article[]>([]);
  const [nextEvent, setNextEvent] = useState<NewsEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [heroData, trendingData, eventsData] = await Promise.all([
          getArticles(true),
          import("../services/articleService").then(m => m.getTrendingArticles()),
          getEvents()
        ]);
        
        if (heroData.length > 0) {
          setFeatured(heroData[0]);
        } else {
          // Fallback to first available article if none are explicitly marked as featured
          const allArticles = await getArticles();
          if (allArticles.length > 0) {
            setFeatured(allArticles[0]);
          }
        }
        setTrending(trendingData.slice(0, 3));
        
        if (eventsData.length > 0) {
          setNextEvent(eventsData[0]);
        }
      } catch (error) {
        console.error("Error in Hero fetchData:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 md:px-12 overflow-hidden bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-7 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6 text-[11px] font-bold uppercase tracking-widest text-brand-accent">
              {loading ? (
                <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
              ) : (
                <>
                  <span className="bg-blue-50 px-2 py-0.5 rounded">{featured?.category || "Report"}</span>
                  <span className="text-slate-300">•</span>
                  <span>{featured?.readTime || "5 Min Read"}</span>
                </>
              )}
            </div>
            
            {loading ? (
              <div className="text-6xl md:text-8xl font-editorial font-black leading-[0.95] tracking-tight mb-8 space-y-4">
                <div className="h-16 md:h-24 w-full bg-slate-50 animate-pulse rounded" />
                <div className="h-16 md:h-24 w-3/4 bg-slate-50 animate-pulse rounded" />
              </div>
            ) : (
              <h1 className="text-6xl md:text-8xl font-editorial font-black leading-[0.95] tracking-tight mb-8">
                {featured ? (
                  <>
                    {featured.title.split(' ').slice(0, -1).join(' ')} <br />
                    <span className="italic-editorial text-brand-primary">{featured.title.split(' ').pop()}.</span>
                  </>
                ) : (
                  <>
                    Welcome to <br />
                    <span className="italic-editorial text-brand-primary">The Future.</span>
                  </>
                )}
              </h1>
            )}
            
            {loading ? (
              <div className="space-y-2 mb-10">
                <div className="h-6 w-full max-w-xl bg-slate-50 animate-pulse rounded" />
                <div className="h-6 w-5/6 max-w-xl bg-slate-50 animate-pulse rounded" />
              </div>
            ) : (
              <p className="text-xl text-slate-600 leading-relaxed max-w-xl mb-10">
                {featured?.excerpt || "Stay updated with the latest technological breakthroughs and industry insights from our global network of experts."}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {!loading && featured ? (
                <Link 
                  to={`/article/${featured.id}`} 
                  className="w-full sm:w-auto bg-black text-white px-10 py-5 font-bold uppercase text-[12px] tracking-[0.2em] hover:bg-brand-accent transition-colors text-center"
                >
                  Read Full Story
                </Link>
              ) : (
                <button disabled={loading} className="w-full sm:w-auto bg-black text-white px-10 py-5 font-bold uppercase text-[12px] tracking-[0.2em] hover:bg-brand-accent transition-colors disabled:opacity-50">
                  Read Full Story
                </button>
              )}
              <button className="w-full sm:w-auto border border-slate-200 px-10 py-5 font-bold uppercase text-[12px] tracking-[0.2em] hover:bg-slate-50 transition-colors">
                Become a Contributor
              </button>
            </div>

            <div className="mt-16 flex items-center gap-12 pt-12 border-t border-slate-100">
              <div>
                <p className="editorial-label mb-1">Lead Analysis By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    {loading ? (
                      <div className="w-full h-full animate-pulse bg-slate-200" />
                    ) : (
                      <img src={featured?.author ? `https://ui-avatars.com/api/?name=${featured.author}` : "https://ui-avatars.com/api/?name=Admin"} alt="Author" />
                    )}
                  </div>
                  <div>
                    {loading ? (
                      <div className="space-y-1">
                        <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                        <div className="h-3 w-32 bg-slate-50 animate-pulse rounded" />
                      </div>
                    ) : (
                      <>
                        <p className="font-serif font-bold text-lg leading-tight">{featured?.author || "News Team"}</p>
                        <p className="text-xs text-slate-500">{featured?.date || "Editorial Staff"}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <h3 className="editorial-label flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Trending Now
            </h3>
            
            <div className="space-y-8">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2">
                    <div className="h-10 w-12 bg-slate-50" />
                    <div className="h-6 w-full bg-slate-50" />
                    <div className="h-4 w-32 bg-slate-50" />
                  </div>
                ))
              ) : trending.length > 0 ? (
                trending.map((item, idx) => (
                  <Link key={item.id} to={`/article/${item.id}`} className="group cursor-pointer block border-none outline-none">
                    <div className="text-slate-200 font-serif text-5xl font-bold mb-1 group-hover:text-brand-accent transition-colors leading-none">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <h4 className="font-bold text-xl leading-snug group-hover:underline">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-2 uppercase tracking-wide">
                      {item.date} • {item.category}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="p-6 border border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                  <p className="font-medium text-slate-600 mb-1">No trending stories published yet</p>
                  <p className="text-xs">Publish articles in the Editorial Dashboard to highlight stories here.</p>
                </div>
              )}
            </div>

            <div 
              onClick={() => nextEvent?.registrationLink ? window.open(nextEvent.registrationLink, '_blank') : navigate('/events')}
              className="mt-8 p-8 bg-brand-accent text-white rounded-2xl relative overflow-hidden group cursor-pointer shadow-xl shadow-brand-accent/20"
            >
               <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Upcoming Conference</span>
               {loading ? (
                 <div className="h-8 w-3/4 bg-white/20 animate-pulse rounded mt-2 mb-6" />
               ) : (
                 <h4 className="text-2xl font-bold mt-2 mb-6">
                   {nextEvent ? nextEvent.title : "Future Summit 2026"}
                 </h4>
               )}
               <div className="flex items-center justify-between">
                 {loading ? (
                    <div className="space-y-2">
                      <div className="h-6 w-24 bg-white/20 animate-pulse rounded" />
                      <div className="h-3 w-32 bg-white/10 animate-pulse rounded" />
                    </div>
                 ) : (
                   <div className="flex flex-col">
                     <span className="text-xl font-mono font-bold">
                       {nextEvent ? nextEvent.date : "Coming Soon"}
                     </span>
                     <span className="text-[10px] uppercase tracking-tighter opacity-60">
                       {nextEvent ? nextEvent.location : "Global Event"}
                     </span>
                   </div>
                 )}
                 <button className="bg-white text-brand-accent px-5 py-2 text-[10px] font-bold uppercase tracking-tighter rounded shadow-lg hover:bg-slate-50 transition-all">Secure Pass</button>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
