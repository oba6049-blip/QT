import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSpotlightStories } from "../services/spotlightService";
import { SpotlightStory } from "../types";
import { ArrowRight, Loader2, Quote } from "lucide-react";

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

  return (
    <section className="py-24 px-6 md:px-12 bg-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <span className="editorial-label text-brand-accent tracking-[0.3em] block mb-4">Founder Spotlight</span>
            <h2 className="text-4xl md:text-6xl font-editorial font-bold text-slate-900">The Architects of <br />Tomorrow's Africa</h2>
          </div>
          <p className="text-slate-500 max-w-md text-lg italic font-serif">
            "We aren't just building companies; we are architecting the future of a continent."
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {stories.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => navigate(`/spotlight/${story.id}`)}
              className="bg-white border border-slate-200 flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:border-brand-accent/50 transition-all shadow-sm hover:shadow-xl"
            >
              <div className="md:w-2/5 relative overflow-hidden">
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
              
              <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <Quote size={40} className="text-brand-accent/20 mb-6" />
                  <span className="editorial-label text-brand-accent hidden md:block mb-4">
                    {story.companyName}
                  </span>
                  <h3 className="text-2xl font-editorial font-bold mb-6 text-slate-900 group-hover:text-brand-accent transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed italic font-serif mb-8 line-clamp-4">
                    "{getCleanSnippet(story.story)}"
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-slate-100 gap-4">
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{story.founderName}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Founder & Visionary • {story.companyName}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:text-right">
                    <div className="space-y-0.5 text-left sm:text-right">
                      <p className="text-xs font-semibold text-slate-800">By {story.author || 'TechQuo Editorial Staff'}</p>
                      <p className="text-[10px] text-slate-400">Published by {story.postedByName || 'TechQuo News'}</p>
                    </div>
                    {story.link && (
                      <a 
                        href={story.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-black hover:text-white transition-all text-slate-400 shrink-0"
                        title="Visit feature link"
                      >
                        <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
