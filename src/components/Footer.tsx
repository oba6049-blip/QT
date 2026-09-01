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
              <span className="font-editorial font-black text-4xl tracking-tighter uppercase text-white">TechQuo News<span className="text-brand-accent">.</span></span>
            </div>
            <p className="max-w-sm text-slate-500 mb-10 leading-relaxed text-sm">
              TechQuo News is the authoritative tech media platform reporting on African technology innovation, venture capital, fintech rails, and digital business developments.
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
              <li><Link to="/spotlights" className="hover:text-brand-accent transition-colors italic-editorial">Founder Spotlights</Link></li>
              <li><Link to="/technology" className="hover:text-brand-accent transition-colors italic-editorial">Technology</Link></li>
              <li><Link to="/fintech" className="hover:text-brand-accent transition-colors italic-editorial">FinTech</Link></li>
              <li><Link to="/business" className="hover:text-brand-accent transition-colors italic-editorial">Business</Link></li>
              <li><Link to="/startups" className="hover:text-brand-accent transition-colors italic-editorial">Startups</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-label text-white mb-8">Company</h4>
            <ul className="space-y-4 text-[13px] font-medium tracking-tight">
              <li><Link to="/about" className="hover:text-brand-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-brand-accent transition-colors">Contact Newsroom</Link></li>
              <li><Link to="/partnerships" className="hover:text-brand-accent transition-colors">Partnerships & Ads</Link></li>
              <li><Link to="/contributors" className="hover:text-brand-accent transition-colors">Our Columnists</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="editorial-label text-white mb-8">Resources</h4>
            <ul className="space-y-4 text-[13px] font-medium tracking-tight">
              <li><Link to="/sitemap.xml" target="_blank" className="hover:text-brand-accent transition-colors">XML Sitemap</Link></li>
              <li><Link to="/robots.txt" target="_blank" className="hover:text-brand-accent transition-colors">Robots.txt</Link></li>
              <li><Link to="/events" className="hover:text-brand-accent transition-colors">Events Hub</Link></li>
              <li><Link to="/trending" className="hover:text-brand-accent transition-colors">Top Stories</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            © 2026 TechQuo News Media Group. <span className="text-slate-700 ml-2">All Rights Reserved.</span>
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
