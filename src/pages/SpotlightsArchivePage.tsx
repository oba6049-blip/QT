import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Building2, 
  Quote, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  Calendar,
  Layers
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Newsletter from "../components/Newsletter";
import { getSpotlightStories } from "../services/spotlightService";
import { SpotlightStory } from "../types";

export default function SpotlightsArchivePage() {
  const [stories, setStories] = useState<SpotlightStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStories = async () => {
      try {
        const data = await getSpotlightStories();
        setStories(data);
      } catch (err) {
        console.error("Error fetching spotlight stories:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const getCleanSnippet = (content: string) => {
    if (!content) return '';
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  // Distinct company list for filter pills
  const companies = useMemo(() => {
    const set = new Set<string>();
    stories.forEach((s) => {
      if (s.companyName?.trim()) set.add(s.companyName.trim());
    });
    return Array.from(set);
  }, [stories]);

  // Filtered stories based on search query & company filter
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        story.founderName?.toLowerCase().includes(q) ||
        story.companyName?.toLowerCase().includes(q) ||
        story.title?.toLowerCase().includes(q) ||
        story.story?.toLowerCase().includes(q);

      const matchCompany =
        selectedCompanyFilter === "all" ||
        story.companyName?.trim().toLowerCase() === selectedCompanyFilter.toLowerCase();

      return matchSearch && matchCompany;
    });
  }, [stories, searchQuery, selectedCompanyFilter]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-black selection:text-white">
      <Helmet>
        <title>Founder & Startup Spotlights | TechQuo News</title>
        <meta 
          name="description" 
          content="In-depth profiles, visionary journeys, and breakthrough startup narratives from African tech founders and innovators." 
        />
        <link rel="canonical" href="https://techquonews.com/spotlights" />
        <meta property="og:title" content="Founder & Startup Spotlights | TechQuo News" />
        <meta 
          property="og:description" 
          content="In-depth profiles, visionary journeys, and breakthrough startup narratives from African tech founders and innovators." 
        />
        <meta property="og:url" content="https://techquonews.com/spotlights" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Founder & Startup Spotlights | TechQuo News",
            "description": "In-depth profiles, visionary journeys, and breakthrough startup narratives from African tech founders and innovators.",
            "url": "https://techquonews.com/spotlights",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": stories.slice(0, 20).map((s, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Article",
                  "name": `${s.founderName} - ${s.companyName}`,
                  "headline": s.title,
                  "url": `https://techquonews.com/spotlight/${s.slug || s.id}`,
                  "image": s.image
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-8">
            <Link to="/" className="hover:text-black flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900 font-bold uppercase tracking-wider">Founder Spotlights</span>
          </div>

          {/* Hero Header */}
          <header className="mb-14 border-b border-slate-200 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-bold uppercase tracking-widest text-amber-900 mb-4">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Editorial Series • Founder Spotlight</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-editorial font-bold text-slate-950 tracking-tight leading-[1.08] mb-5">
                  The Architects of <br className="hidden sm:inline" />Tomorrow's Digital Economy
                </h1>
                <p className="text-slate-600 text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed">
                  Discover the personal journeys, bold market bets, and technical breakthroughs shaping Africa’s next generation of category-defining enterprises.
                </p>
              </div>

              <div className="shrink-0 bg-white border border-slate-200 p-5 rounded shadow-xs max-w-xs w-full">
                <div className="text-3xl font-editorial font-black text-slate-950 mb-1">
                  {stories.length}
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Featured Founder Stories
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                  Curated and fact-checked by the TechQuo News Editorial Board.
                </p>
              </div>
            </div>
          </header>

          {/* Search and Filters Bar */}
          <div className="mb-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 shadow-xs rounded-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by founder, company, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1">
                Filter:
              </span>
              <button
                onClick={() => setSelectedCompanyFilter("all")}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCompanyFilter === "all"
                    ? "bg-black text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Stories ({stories.length})
              </button>
              {companies.map((comp) => (
                <button
                  key={comp}
                  onClick={() => setSelectedCompanyFilter(comp)}
                  className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
                    selectedCompanyFilter.toLowerCase() === comp.toLowerCase()
                      ? "bg-black text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          {/* Stories Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200">
              <Loader2 className="animate-spin text-brand-accent mb-4" size={36} />
              <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading founder spotlights...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="bg-white border border-slate-200 p-16 text-center rounded-sm">
              <Building2 className="mx-auto text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-editorial font-bold text-slate-900 mb-2">No Spotlights Found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                No founder stories match your search criteria. Try adjusting your search query or reset the filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCompanyFilter("all");
                }}
                className="px-5 py-2.5 bg-black text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {filteredStories.map((story, idx) => (
                <motion.article
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => navigate(`/spotlight/${story.slug || story.id}`)}
                  className="bg-white border border-slate-200 flex flex-col md:flex-row overflow-hidden group cursor-pointer hover:border-brand-accent/50 transition-all shadow-xs hover:shadow-xl rounded-sm"
                >
                  {/* Visual Portrait Image - Consistent with Landing Page */}
                  <div className="md:w-2/5 relative overflow-hidden bg-slate-900 min-h-[260px] md:min-h-full">
                    <img
                      src={story.image}
                      alt={story.founderName}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                    <div className="absolute bottom-4 left-4 text-white md:hidden">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{story.companyName}</p>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-between">
                    <div>
                      <Quote size={32} className="text-brand-accent/20 mb-4" />
                      <span className="editorial-label text-brand-accent hidden md:block mb-3">
                        {story.companyName}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-editorial font-bold mb-4 text-slate-900 group-hover:text-brand-accent transition-colors leading-snug">
                        {story.title}
                      </h2>
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
                </motion.article>
              ))}
            </div>
          )}

          {/* Spotlight Submission Callout */}
          <section className="mt-20 bg-slate-900 text-white p-8 sm:p-12 rounded-sm border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-brand-accent bg-white/5 px-2.5 py-1 rounded mb-3">
                <Layers size={12} /> Newsroom Submissions
              </div>
              <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-white mb-3">
                Know an Inspiring Founder or Pioneering Startup?
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our editorial team is constantly seeking transformative stories across AI, FinTech, Cleantech, and frontier infrastructure across emerging markets.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-6 py-3.5 bg-white text-slate-950 font-bold text-xs uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-colors shrink-0 rounded-sm"
            >
              Pitch a Founder Spotlight →
            </Link>
          </section>

        </div>
      </main>

      <Newsletter />
      <Footer />
    </div>
  );
}
