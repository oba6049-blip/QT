import { motion, AnimatePresence } from "motion/react";
import { Search, Menu, User, Bell, LogOut, Settings, Lock } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { logout, ADMIN_EMAIL } from "../lib/auth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: "Trending", path: "/trending" },
    { name: "Technology", path: "/category/Technology" },
    { name: "FinTech", path: "/category/FinTech" },
    { name: "Business", path: "/category/Business" },
    { name: "Markets", path: "/category/Markets" },
    { name: "Events", path: "/events" }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16 flex items-center px-6 md:px-12"
    >
      <div className="flex items-center gap-12 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-1 cursor-pointer group">
          <span className="font-editorial font-black text-2xl tracking-tighter uppercase">Quotients Africa<span className="text-brand-accent">.</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-8 flex-1">
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

        <div className="flex items-center gap-6 ml-auto">
          <button className="p-2 hover:bg-slate-50 rounded-full transition-colors hidden sm:flex">
            <Search size={18} className="text-slate-600" />
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
              <div className="flex justify-between items-center mb-12">
                <span className="font-editorial font-black text-xl">MENU</span>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-black"
                >
                  <Menu size={24} className="rotate-90" />
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link 
                    key={item.name} 
                    to={item.path} 
                    onClick={() => setShowMobileMenu(false)}
                    className="text-2xl font-editorial font-bold hover:text-brand-accent transition-colors"
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

              <div className="mt-auto pt-12 border-t border-slate-100 italic font-serif text-slate-400 text-sm">
                Quotients Africa &copy; 2026. <br />
                All Rights Reserved.
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
