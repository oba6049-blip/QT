import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getSpotlightStories } from "../services/spotlightService";
import { SpotlightStory } from "../types";
import { ArrowRight, Loader2, Quote, Sparkles } from "lucide-react";

export default function Spotlight() {
  const [stories, setStories] = useState<SpotlightStory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getCleanSnippet = (content: string) => {
    if (!content) return '';
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    const fetchStories = async () => {
      const data = await getSpotlightStories();
      setStories(data);
      setLoading(false);
    };
    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20 bg-slate-50">
        <Loader2 className="animate-spin text-brand-accent" size={32} />
      </div>
    );
  }

  if (stories.length === 0) return null;

  // Show up to 4 spotlight stories on the landing page
  const displayedStories = stories.slice(0, 4);

  return (
    <section className="py-24 px-6 md:px-12 bg-slate-50 overflow-hidden border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-bold uppercase tracking-widest text-amber-900 mb-4">
              <Sparkles size={13} className="text-amber-600" />
              <span>Founder Spotlight Series</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-editorial font-bold text-slate-900 leading-tight">
              The Architects of <br />Tomorrow's Africa
            </h2>
          </div>
          
          <div className="flex flex-col sm:items-end gap-3">
            <p className="text-slate-500 max-w-md text-base sm:text-lg italic font-serif sm:text-right">
              "We aren't just building companies; we are architecting the future of a continent."
            </p>
            <Link
              to="/spotlights"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent transition-colors group"
            >
              <span>View All Founder Spotlights ({stories.length})</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {displayedStories.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/spotlight/${story.slug || story.id}`)}
              className="bg-white border border-slate-200 flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:border-brand-accent/50 transition-all shadow-xs hover:shadow-xl rounded-sm"
            >
              <div className="md:w-2/5 relative overflow-hidden bg-slate-900 min-h-[220px]">
                <img 
                  src={story.image} 
                  alt={story.founderName} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                <div className="absolute bottom-4 left-4 text-white md:hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest">{story.companyName}</p>
                </div>
              </div>
              
              <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <Quote size={32} className="text-brand-accent/20 mb-4" />
                  <span className="editorial-label text-brand-accent hidden md:block mb-3">
                    {story.companyName}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-editorial font-bold mb-4 text-slate-900 group-hover:text-brand-accent transition-colors leading-snug">
                    {story.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed italic font-serif mb-6 line-clamp-3 text-sm">
                    "{getCleanSnippet(story.story)}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 gap-4">
                  <div>
                    <p className="font-bold text-slate-900 leading-tight text-sm">{story.founderName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Founder • {story.companyName}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 group-hover:text-brand-accent transition-colors hidden sm:inline-block">
                      Read Story
                    </span>
                    <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-all text-slate-400 shrink-0">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {stories.length > 4 && (
          <div className="mt-12 text-center">
            <Link
              to="/spotlights"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-950 font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all shadow-xs rounded-sm group"
            >
              <span>Explore All {stories.length} Founder Spotlights</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform text-brand-accent group-hover:text-white" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
