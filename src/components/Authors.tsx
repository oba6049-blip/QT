import { motion } from "motion/react";
import { Twitter, Linkedin, ExternalLink, Loader2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getContributors } from "../services/contributorService";
import { getExperts } from "../services/expertService";
import { Contributor } from "../types";
import { Link } from "react-router-dom";

export default function Authors() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      setLoading(true);
      try {
        const data = await getContributors('active');
        if (data && data.length > 0) {
          setContributors(data);
        } else {
          // Fallback to experts if contributors is empty
          const fallback = await getExperts();
          const mapped: Contributor[] = fallback.map(e => ({
            id: e.id,
            name: e.name,
            slug: e.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            title: e.title,
            bio: e.bio,
            profileImage: e.image,
            socialLinks: {
              twitter: e.twitter,
              linkedin: e.linkedin,
              website: e.website
            },
            status: 'active',
            totalArticles: e.contributionsCount || 1,
            expertise: [(e as any).specialty || 'Technology']
          }));
          setContributors(mapped);
        }
      } catch (error) {
        console.error("Error fetching contributors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  if (!loading && contributors.length === 0) return null;

  return (
    <section className="py-24 px-6 md:px-12 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="editorial-label text-brand-accent mb-4 block">The Newsroom</span>
            <h2 className="text-4xl md:text-5xl font-editorial font-bold mb-4">Meet the Experts</h2>
            <p className="text-slate-500">The minds behind the most impactful stories in tech and business.</p>
          </div>
          <Link 
            to="/contributors" 
            className="editorial-label text-black hover:text-brand-accent transition-colors flex items-center gap-1"
          >
            View All Contributors <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-accent" size={32} />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 border-t border-l border-slate-100">
            {contributors.slice(0, 6).map((contributor, idx) => {
              const slug = contributor.slug || contributor.id;
              const img = contributor.profileImage || contributor.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";

              return (
                <motion.div
                  key={contributor.id || contributor._id || idx}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-12 border-r border-b border-slate-100 group relative overflow-hidden hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col items-center text-center">
                    <Link to={`/contributors/${slug}`} className="relative mb-8 block">
                      <img 
                        src={img} 
                        alt={contributor.name} 
                        className="w-20 h-20 rounded-full object-cover border border-slate-200 p-1 relative z-10 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    <h3 className="font-editorial font-bold text-2xl mb-1">
                      <Link to={`/contributors/${slug}`} className="hover:text-brand-accent transition-colors">
                        {contributor.name}
                      </Link>
                    </h3>
                    <p className="editorial-label text-brand-accent mb-4">{contributor.title}</p>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-3 leading-relaxed">{contributor.bio}</p>
                    
                    <div className="pt-4 border-t border-slate-50 w-full mb-6">
                       <Link 
                         to={`/contributors/${slug}`}
                         className="text-[10px] font-bold tracking-widest text-slate-400 hover:text-black transition-colors uppercase"
                       >
                         {contributor.totalArticles || 1} {contributor.totalArticles === 1 ? 'CONTRIBUTION' : 'CONTRIBUTIONS'}
                       </Link>
                    </div>

                    <div className="flex gap-6 items-center">
                      {contributor.socialLinks?.twitter && (
                        <a 
                          href={contributor.socialLinks.twitter.startsWith('@') ? `https://twitter.com/${contributor.socialLinks.twitter.slice(1)}` : contributor.socialLinks.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-400 hover:text-black transition-colors"
                          title="X / Twitter"
                        >
                          <Twitter size={18} />
                        </a>
                      )}
                      {contributor.socialLinks?.linkedin && (
                        <a 
                          href={contributor.socialLinks.linkedin.startsWith('http') ? contributor.socialLinks.linkedin : `https://linkedin.com/in/${contributor.socialLinks.linkedin}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-400 hover:text-black transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin size={18} />
                        </a>
                      )}
                      {contributor.socialLinks?.website && (
                        <a 
                          href={contributor.socialLinks.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-slate-400 hover:text-black transition-colors"
                          title="Website"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
