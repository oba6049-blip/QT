import { Twitter, Linkedin, Github, Instagram, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-black text-slate-400 pt-24 pb-12 px-6 md:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 mb-24">
          <div className="col-span-2">
            <div className="flex items-center gap-1 mb-10 group cursor-pointer">
              <span className="font-editorial font-black text-4xl tracking-tighter uppercase text-white">Quotients Africa<span className="text-brand-accent">.</span></span>
            </div>
            <p className="max-w-sm text-slate-500 mb-10 leading-relaxed text-sm">
              Quotients Africa is a leading global media company focused on technology, startups, and business insights that shape our collective future.
            </p>
            <div className="flex gap-6">
              {[Twitter, Linkedin, Github, Instagram].map((Icon, idx) => (
                <a key={idx} href="#" className="text-slate-500 hover:text-white transition-all">
                  <Icon size={22} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="editorial-label text-white mb-8">Categories</h4>
            <ul className="space-y-4 text-[13px] font-medium tracking-tight">
              <li><Link to="/trending" className="hover:text-brand-accent transition-colors italic-editorial">Trending Now</Link></li>
              <li><Link to="/category/Technology" className="hover:text-brand-accent transition-colors italic-editorial">Technology</Link></li>
              <li><Link to="/category/FinTech" className="hover:text-brand-accent transition-colors italic-editorial">FinTech</Link></li>
              <li><Link to="/category/Business" className="hover:text-brand-accent transition-colors italic-editorial">Business</Link></li>
              <li><Link to="/category/Markets" className="hover:text-brand-accent transition-colors italic-editorial">Markets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label text-white mb-8">Company</h4>
            <ul className="space-y-4 text-[13px] font-medium tracking-tight">
              <li><Link to="/" className="hover:text-brand-accent transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Our Vision</Link></li>
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Advertise</Link></li>
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Press Kit</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="editorial-label text-white mb-8">Resources</h4>
            <ul className="space-y-4 text-[13px] font-medium tracking-tight">
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Help Center</Link></li>
              <li><Link to="/" className="hover:text-brand-accent transition-colors">Newsletter</Link></li>
              <li><Link to="/events" className="hover:text-brand-accent transition-colors">Events Hub</Link></li>
              <li><Link to="/admin/login" className="hover:text-brand-accent transition-colors">Editorial Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 Quotients Africa Media Group. <span className="text-slate-700 ml-2">All Rights Reserved.</span>
          </p>
          <div className="flex gap-8">
             <a href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-white">Privacy</a>
             <a href="#" className="text-[10px] font-bold uppercase tracking-widest hover:text-white">Terms</a>
             <button 
               onClick={scrollToTop}
               className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white hover:text-brand-accent transition-colors"
             >
               Top <ArrowUp size={12} />
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
