import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Contributor, Article } from '../types';
import { getContributorBySlug, getContributorArticles } from '../services/contributorService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  Github, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Share2, 
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function ContributorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    window.scrollTo(0, 0);

    const loadContributorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, authorArticles] = await Promise.all([
          getContributorBySlug(slug),
          getContributorArticles(slug),
        ]);

        if (!profile) {
          setError('Contributor not found.');
        } else {
          setContributor(profile);
          setArticles(authorArticles);

          // Update browser page title
          document.title = `${profile.name} - ${profile.title || 'Contributor'} | TechQuo News`;
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load contributor profile');
      } finally {
        setLoading(false);
      }
    };

    loadContributorData();
  }, [slug]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-brand-accent mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Loading Contributor Profile...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white p-12 border border-slate-200 rounded-sm shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-accent block mb-2">
              Editorial Directory
            </span>
            <h1 className="text-3xl font-editorial font-bold text-slate-900 mb-4">
              Contributor Profile Not Found
            </h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-8">
              We could not find an active contributor matching the URL <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">/contributors/{slug}</code>.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
              >
                <ArrowLeft size={14} /> Return to Homepage
              </Link>
              <Link
                to="/contributors"
                className="inline-flex items-center gap-2 bg-slate-100 text-slate-800 px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                View Contributors Directory
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const profileImg =
    contributor.profileImage ||
    contributor.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';

  const joinedFormatted = (() => {
    if (!contributor.joinedAt) return '2024';
    if (/^\d{4}-\d{2}-\d{2}$/.test(contributor.joinedAt)) {
      const d = new Date(contributor.joinedAt + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    const d = new Date(contributor.joinedAt);
    if (isNaN(d.getTime())) return contributor.joinedAt;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  })();

  const isIndexable = contributor.status === 'active' && articles.length > 0;
  const canonicalUrl = `https://techquonews.com/contributors/${contributor.slug || slug}`;
  const pageTitle = `${contributor.name} - ${contributor.title || 'Technology Contributor'} | TechQuo News`;
  const pageDescription = contributor.bio || `Read articles and insights by ${contributor.name}, a ${contributor.title || 'Technology Contributor'} at TechQuo News.`;

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: contributor.name,
    jobTitle: contributor.title || 'Technology Contributor',
    worksFor: {
      '@type': 'Organization',
      name: 'TechQuo News',
      url: 'https://techquonews.com',
    },
    description: contributor.bio,
    image: profileImg,
    url: canonicalUrl,
    sameAs: [
      contributor.socialLinks?.linkedin,
      contributor.socialLinks?.twitter,
      contributor.socialLinks?.website,
      contributor.socialLinks?.github,
    ].filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={isIndexable ? "index, follow" : "noindex, follow"} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={profileImg} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="TechQuo News" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={profileImg} />
      </Helmet>

      {/* Schema.org Person JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />

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
              <Link to="/contributors" className="hover:text-black transition-colors">
                Contributors
              </Link>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-slate-900 font-bold truncate">{contributor.name}</span>
            </nav>
          </div>
        </div>

        {/* Contributor Profile Header Hero */}
        <section className="bg-white border-b border-slate-200 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 lg:gap-12">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 ring-1 ring-slate-200">
                  <img
                    src={profileImg}
                    alt={contributor.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {contributor.status === 'active' && (
                  <span
                    className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm"
                    title="Active Verified Contributor"
                  >
                    <CheckCircle2 size={16} />
                  </span>
                )}
              </div>

              {/* Bio & Details */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {contributor.contributorType === 'guest' ? (
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-sm border border-amber-200">
                      Guest Contributor
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-sm border border-indigo-200">
                      Staff Contributor
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <Calendar size={13} /> Joined {joinedFormatted}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <BookOpen size={13} /> {articles.length} {articles.length === 1 ? 'Article' : 'Articles'} Published
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-bold text-slate-900 tracking-tight">
                    {contributor.name}
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 font-medium mt-1">
                    {contributor.title}
                  </p>
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed max-w-3xl">
                  {contributor.bio}
                </p>

                {/* Social & Contact Bar */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    {contributor.socialLinks?.linkedin && (
                      <a
                        href={contributor.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#0077b5] text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                        title="LinkedIn Profile"
                      >
                        <Linkedin size={16} />
                      </a>
                    )}
                    {contributor.socialLinks?.twitter && (
                      <a
                        href={contributor.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-black text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                        title="X / Twitter"
                      >
                        <Twitter size={16} />
                      </a>
                    )}
                    {contributor.socialLinks?.website && (
                      <a
                        href={contributor.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-brand-accent text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                        title="Personal Website"
                      >
                        <Globe size={16} />
                      </a>
                    )}
                    {contributor.socialLinks?.github && (
                      <a
                        href={contributor.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#333] text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                        title="GitHub"
                      >
                        <Github size={16} />
                      </a>
                    )}
                    {contributor.showEmail && contributor.email && (
                      <a
                        href={`mailto:${contributor.email}`}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                        title={`Email ${contributor.name}`}
                      >
                        <Mail size={16} />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <Share2 size={13} />
                    {copied ? 'Link Copied!' : 'Share Profile'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section: Bio Deep-Dive & Articles */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Sidebar Column: Areas of Expertise & Extended Info */}
            <div className="space-y-8">
              {/* Areas of Expertise */}
              {contributor.expertise && contributor.expertise.length > 0 && (
                <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-brand-accent" />
                    Coverage & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {contributor.expertise.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded-full border border-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extended Biography */}
              {contributor.longBio && (
                <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 pb-3 border-b border-slate-100">
                    Background & Editorial Beat
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line">
                    {contributor.longBio}
                  </div>
                </div>
              )}

              {/* TechQuo News Contributor Badge */}
              <div className="bg-slate-900 text-white p-6 rounded-sm shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent block">
                  TechQuo News Editorial Network
                </span>
                <h4 className="text-base font-editorial font-bold text-white">
                  Want to contribute insights?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We welcome African technologists, venture partners, and policy analysts to submit op-eds and ecosystem research.
                </p>
                <Link
                  to="/events"
                  className="inline-block text-xs font-bold text-brand-accent hover:underline uppercase tracking-wider pt-1"
                >
                  Learn more about our editorial guidelines →
                </Link>
              </div>
            </div>

            {/* Main Column: Published Articles */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-2xl font-editorial font-bold text-slate-900">
                    Articles by {contributor.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing all {articles.length} published pieces, analysis, and reports.
                  </p>
                </div>
              </div>

              {articles.length === 0 ? (
                <div className="bg-white p-12 border border-slate-200 rounded-sm text-center">
                  <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-editorial font-bold text-slate-800">
                    No articles published yet
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {contributor.name} has not published any stories yet. Check back soon for upcoming reporting.
                  </p>
                  <Link
                    to="/"
                    className="mt-6 inline-block text-xs font-bold uppercase tracking-wider text-brand-accent hover:underline"
                  >
                    Browse latest stories on TechQuo News
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {articles.map((article) => {
                    const articleId = article.slug || article.id || article._id;
                    const dateFormatted = article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : article.date || 'Recent';

                    return (
                      <article
                        key={article.id || article._id}
                        className="bg-white p-6 border border-slate-200 rounded-sm shadow-2xs hover:border-slate-300 transition-all group flex flex-col sm:flex-row gap-6"
                      >
                        {/* Article Thumbnail */}
                        {article.image && (
                          <Link
                            to={`/article/${articleId}`}
                            className="sm:w-48 sm:h-32 h-48 w-full shrink-0 overflow-hidden rounded-md bg-slate-100 relative block"
                          >
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {article.category && (
                              <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                                {article.category}
                              </span>
                            )}
                          </Link>
                        )}

                        {/* Article Content */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mb-1.5">
                              <span className="font-medium">{dateFormatted}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <Clock size={12} /> {article.readTime || '5 min read'}
                              </span>
                            </div>

                            <h3 className="text-lg font-editorial font-bold text-slate-900 group-hover:text-brand-accent transition-colors leading-snug">
                              <Link to={`/article/${articleId}`}>{article.title}</Link>
                            </h3>

                            <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                              {article.excerpt}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <Link
                              to={`/article/${articleId}`}
                              className="text-xs font-bold uppercase tracking-wider text-black group-hover:text-brand-accent flex items-center gap-1 transition-colors"
                            >
                              Read Full Article <ChevronRight size={13} />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
