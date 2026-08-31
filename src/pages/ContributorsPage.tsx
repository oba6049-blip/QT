import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Contributor } from '../types';
import { getContributors } from '../services/contributorService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Users, Search, BookOpen, ExternalLink, ArrowRight, Loader2, Sparkles, ChevronRight } from 'lucide-react';

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Our Contributors & Authors | TechQuo News";

    const load = async () => {
      setLoading(true);
      try {
        const list = await getContributors('active');
        setContributors(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Collect all unique topics/beats
  const allTopics = ['All', ...Array.from(new Set(contributors.flatMap((c) => c.expertise || [])))];

  const filteredContributors = contributors.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.bio.toLowerCase().includes(search.toLowerCase());

    const matchesTopic =
      selectedTopic === 'All' ||
      (c.expertise && c.expertise.includes(selectedTopic));

    return matchesSearch && matchesTopic;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Link to="/" className="hover:text-black transition-colors">
                Home
              </Link>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-bold">Contributors</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="bg-white border-b border-slate-200 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent block mb-2">
              Editorial Network
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-bold text-slate-900 tracking-tight mb-4">
              Meet Our Contributors & Analysts
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              The journalists, venture investors, technologists, and policy leaders driving in-depth coverage across Africa's innovation economy.
            </p>

            {/* Search Bar */}
            <div className="mt-8 relative max-w-xl mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contributors by name, topic, or role..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:outline-none focus:border-black shadow-2xs"
              />
            </div>
          </div>
        </section>

        {/* Topic Filters */}
        {allTopics.length > 1 && (
          <section className="bg-slate-100/70 border-b border-slate-200 py-3">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto flex items-center gap-2 no-scrollbar">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-2">
                Beats:
              </span>
              {allTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedTopic === topic
                      ? 'bg-black text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Contributors Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 size={32} className="animate-spin text-brand-accent mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Loading Contributors Directory...
              </p>
            </div>
          ) : filteredContributors.length === 0 ? (
            <div className="bg-white p-12 border border-slate-200 rounded-sm text-center max-w-md mx-auto">
              <Users size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-editorial font-bold text-slate-800">
                No contributors matched your search
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing your search query or selecting a different topic.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedTopic('All');
                }}
                className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-brand-accent hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContributors.map((c) => {
                const slug = c.slug || c.id;
                const profileImg =
                  c.profileImage ||
                  c.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

                return (
                  <div
                    key={c.id || c._id}
                    className="bg-white border border-slate-200 rounded-sm p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-4">
                        <Link to={`/contributors/${slug}`} className="shrink-0">
                          <img
                            src={profileImg}
                            alt={c.name}
                            className="w-16 h-16 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-brand-accent/50 transition-all"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {c.contributorType === 'guest' ? (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-200">
                                Guest Contributor
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-800 text-[9px] font-bold uppercase tracking-wider rounded border border-indigo-200">
                                Staff Contributor
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-editorial font-bold text-slate-900 group-hover:text-brand-accent transition-colors leading-snug">
                            <Link to={`/contributors/${slug}`}>{c.name}</Link>
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                            {c.title}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            <BookOpen size={11} /> {c.totalArticles ?? 0} {c.totalArticles === 1 ? 'article' : 'articles'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {c.bio}
                      </p>

                      {/* Expertise Tags */}
                      {c.expertise && c.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {c.expertise.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {c.expertise.length > 3 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{c.expertise.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={`/contributors/${slug}`}
                        className="text-xs font-bold uppercase tracking-wider text-black group-hover:text-brand-accent flex items-center gap-1 transition-colors"
                      >
                        View Profile & Stories <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
