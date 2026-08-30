import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Quote, Globe, Twitter, Linkedin, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import { getSpotlightStoryById } from "../services/spotlightService";
import { SpotlightStory } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SpotlightPage() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<SpotlightStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      if (id) {
        const data = await getSpotlightStoryById(id);
        setStory(data);
      }
      setLoading(false);
    };
    fetchStory();
    window.scrollTo(0, 0);
  }, [id]);

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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-brand-accent transition-colors mb-12 uppercase text-[10px] font-bold tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
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

                <div className="mt-16 space-y-6">
                   <h3 className="editorial-label text-brand-accent tracking-[0.3em] border-b border-slate-100 pb-4">Connect</h3>
                   <div className="flex gap-4">
                     {story.link && (
                       <a href={story.link} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-black hover:text-white hover:border-black transition-all">
                         <Globe size={20} />
                       </a>
                     )}
                     <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all">
                       <Twitter size={20} />
                     </button>
                     <button className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#0077B5] hover:text-white hover:border-[#0077B5] transition-all">
                       <Linkedin size={20} />
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
                <span className="editorial-label text-brand-accent tracking-[0.3em] block mb-4 uppercase">Founder Spotlight</span>
                <h1 className="text-5xl md:text-7xl font-editorial font-bold text-slate-900 mb-8 leading-tight">
                  {story.founderName}
                </h1>
                
                <h2 className="text-2xl md:text-3xl font-editorial font-bold text-brand-accent mb-12 italic border-l-4 border-brand-accent pl-8 py-2">
                  "{story.title}"
                </h2>

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
