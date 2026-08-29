import { motion, AnimatePresence } from "motion/react";
import { Search, Menu, User, Bell, LogOut, Settings, Lock, X, Users, BookOpen, Clock, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { logout } from "../lib/auth";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Article, Contributor } from "../types";

export default function Navbar() {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ articles: Article[]; contributors: Contributor[] }>({
    articles: [],
    contributors: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { name: "Trending", path: "/trending" },
    { name: "Technology", path: "/category/Technology" },
    { name: "FinTech", path: "/category/FinTech" },
    { name: "Business", path: "/category/Business" },
    { name: "Markets", path: "/category/Markets" },
    { name: "Contributors", path: "/contributors" },
    { name: "Events", path: "/events" }
  ];

  // Hotkey / or Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (showSearchModal) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSearchResults({ articles: [], contributors: [] });
    }
  }, [showSearchModal]);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ articles: [], contributors: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults({
            articles: data.articles || [],
            contributors: data.contributors || [],
          });
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (path: string) => {
    setShowSearchModal(false);
    navigate(path);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-6 md:px-12"
      >
        <div className="flex items-center gap-8 lg:gap-12 w-full max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-1 cursor-pointer group shrink-0">
            <span className="font-editorial font-black text-2xl tracking-tighter uppercase">
              TechQuo News<span className="text-brand-accent">.</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8 flex-1">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                to={item.path} 
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-black transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            {/* Search Trigger */}
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors flex items-center gap-2 text-slate-600 hover:text-black group"
              title="Search articles and contributors (Press / or Ctrl+K)"
            >
              <Search size={18} />
              <span className="hidden xl:inline-block text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-100"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "Admin"} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono uppercase">
                      {(user.displayName || user.email || "A").charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-bold uppercase tracking-widest hidden md:block">
                    {user.displayName?.split(' ')[0] || "Admin"}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 shadow-xl py-2 z-50 rounded-sm"
                    >
                      <Link 
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-brand-accent hover:bg-slate-50 transition-colors uppercase tracking-widest border-b border-slate-100"
                      >
                        <Settings size={16} />
                        Editorial Panel
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/admin/login"
                className="bg-black text-white p-2.5 hover:bg-brand-accent transition-colors flex items-center justify-center rounded-sm"
                aria-label="Admin Login"
                title="Admin Login"
              >
                <Lock size={16} />
              </Link>
            )}

            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              />
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-50 lg:hidden shadow-2xl p-8 flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <span className="font-editorial font-black text-xl">MENU</span>
                  <button 
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 -mr-2 text-slate-400 hover:text-black"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowSearchModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 font-medium"
                  >
                    <Search size={14} /> Search stories and authors...
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {navItems.map((item) => (
                    <Link 
                      key={item.name} 
                      to={item.path} 
                      onClick={() => setShowMobileMenu(false)}
                      className="text-xl font-editorial font-bold hover:text-brand-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  {user ? (
                    <div className="space-y-3">
                      <Link
                        to="/admin"
                        onClick={() => setShowMobileMenu(false)}
                        className="block text-xs font-bold uppercase tracking-widest text-brand-accent hover:underline"
                      >
                        Admin Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileMenu(false);
                        }}
                        className="block text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/admin/login"
                      onClick={() => setShowMobileMenu(false)}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-900 hover:text-brand-accent"
                    >
                      <Lock size={14} /> Admin Portal Login
                    </Link>
                  )}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-100 italic font-serif text-slate-400 text-xs">
                  TechQuo News &copy; 2026. <br />
                  All Rights Reserved.
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Global Interactive Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-2xl rounded-sm shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
                <Search size={20} className="text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, contributors, fintech, AI, policy..."
                  className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
                {isSearching && <Loader2 size={16} className="animate-spin text-brand-accent shrink-0" />}
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 text-slate-400 hover:text-black rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Content */}
              <div className="overflow-y-auto p-4 space-y-6 flex-1 divide-y divide-slate-100">
                {!searchQuery.trim() ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Search TechQuo News
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Search across all investigative reporting, sector analyses, and verified editorial contributors.
                    </p>
                  </div>
                ) : searchResults.contributors.length === 0 && searchResults.articles.length === 0 && !isSearching ? (
                  <div className="py-10 text-center text-slate-400">
                    <p className="text-sm font-bold text-slate-700">No results found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No articles or contributors matched "{searchQuery}".
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Contributors Results Section */}
                    {searchResults.contributors.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-brand-accent flex items-center gap-1.5">
                            <Users size={13} /> Contributors & Authors ({searchResults.contributors.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {searchResults.contributors.map((c) => {
                            const slug = c.slug || c.id;
                            const profileImg =
                              c.profileImage ||
                              c.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100';

                            return (
                              <div
                                key={c.id || c._id}
                                onClick={() => handleSelectResult(`/contributors/${slug}`)}
                                className="p-2.5 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors flex items-center gap-3 group"
                              >
                                <img
                                  src={profileImg}
                                  alt={c.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-accent truncate">
                                    {c.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 truncate">{c.title}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-400 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Articles Results Section */}
                    {searchResults.articles.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <BookOpen size={13} /> Articles & Analysis ({searchResults.articles.length})
                        </span>
                        <div className="space-y-2">
                          {searchResults.articles.map((article) => {
                            const articleId = article.slug || article.id || article._id;
                            return (
                              <div
                                key={article.id || article._id}
                                onClick={() => handleSelectResult(`/article/${articleId}`)}
                                className="p-3 rounded hover:bg-slate-50 border border-slate-100 hover:border-slate-200 cursor-pointer transition-colors flex gap-3 group"
                              >
                                {article.image && (
                                  <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-16 h-12 rounded object-cover shrink-0 bg-slate-100"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-0.5">
                                    <span className="font-bold uppercase text-brand-accent">{article.category}</span>
                                    <span>•</span>
                                    <span>{article.date}</span>
                                    <span>•</span>
                                    <span>By {article.author}</span>
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-accent line-clamp-1 leading-snug">
                                    {article.title}
                                  </h4>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Search Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close</span>
                <Link
                  to="/contributors"
                  onClick={() => setShowSearchModal(false)}
                  className="font-bold text-brand-accent hover:underline"
                >
                  Explore All Contributors →
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
