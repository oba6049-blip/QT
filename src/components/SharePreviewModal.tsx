import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink,
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  Eye,
  Sparkles,
  Smartphone,
  Globe
} from "lucide-react";

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  url: string;
  image: string;
  type?: "article" | "spotlight";
  categoryOrFounder?: string;
  authorName?: string;
}

export default function SharePreviewModal({
  isOpen,
  onClose,
  title,
  description,
  url,
  image,
  type = "article",
  categoryOrFounder,
  authorName,
}: SharePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"whatsapp" | "twitter" | "linkedin">("whatsapp");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = url.startsWith("http") ? url : `https://www.techquonews.com${url.startsWith("/") ? url : `/${url}`}`;
  const cleanExcerpt = description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const truncatedExcerpt = cleanExcerpt.length > 140 ? `${cleanExcerpt.slice(0, 137)}...` : cleanExcerpt;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: truncatedExcerpt,
          url: fullUrl,
        });
      } catch (err) {
        // Ignored or cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share Intent URLs
  const shareText = type === "spotlight"
    ? `✨ Founder Spotlight: "${title}" on TechQuo News`
    : `📰 ${title} — via TechQuo News`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}&via=TechQuoNews`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                <Share2 size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Share & Link Preview</h3>
                <p className="text-xs text-slate-500">Live preview of how your link displays on social media</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Direct 1-Click Share Actions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Quick Share to Apps
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition-all group shadow-2xs hover:shadow-xs"
                >
                  <MessageCircle size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">WhatsApp</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-900 text-white hover:bg-black border border-slate-800 transition-all group shadow-2xs hover:shadow-xs"
                >
                  <Twitter size={20} className="text-white group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">X (Twitter)</span>
                </a>

                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-all group shadow-2xs hover:shadow-xs"
                >
                  <Linkedin size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">LinkedIn</span>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60 transition-all group shadow-2xs hover:shadow-xs"
                >
                  <Send size={20} className="text-sky-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Telegram</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-all group shadow-2xs hover:shadow-xs"
                >
                  <Facebook size={20} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Facebook</span>
                </a>
              </div>
            </div>

            {/* Live Social Card Preview Section */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <Eye size={14} className="text-brand-accent" />
                  <span>Interactive Card Preview</span>
                </div>
                
                {/* Simulator Tabs */}
                <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("whatsapp")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeTab === "whatsapp" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setActiveTab("twitter")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeTab === "twitter" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    X / Twitter
                  </button>
                  <button
                    onClick={() => setActiveTab("linkedin")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      activeTab === "linkedin" ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    LinkedIn / FB
                  </button>
                </div>
              </div>

              {/* Card Container Preview */}
              <div className="pt-2">
                {activeTab === "whatsapp" && (
                  <div className="bg-[#EFEAE2] p-4 rounded-xl border border-slate-200 max-w-lg mx-auto shadow-inner">
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-black/5 max-w-sm ml-auto">
                      <div className="relative aspect-[1.91/1] w-full bg-slate-900 overflow-hidden">
                        <img 
                          src={image} 
                          alt={title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          www.techquonews.com
                        </div>
                      </div>
                      <div className="p-3 space-y-1 bg-[#F7F8FA]">
                        <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {title}
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {truncatedExcerpt}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="uppercase font-semibold">WWW.TECHQUONEWS.COM</span>
                          <span>12:00 PM ✓✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "twitter" && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-lg mx-auto shadow-sm space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        TQ
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-900">TechQuo News</span>
                          <span className="text-xs text-slate-400">@TechQuoNews</span>
                        </div>
                        <p className="text-xs text-slate-600">{shareText}</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                      <div className="aspect-[1.91/1] w-full bg-slate-900 overflow-hidden relative">
                        <img 
                          src={image} 
                          alt={title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          www.techquonews.com
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">www.techquonews.com</span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{truncatedExcerpt}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "linkedin" && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-lg mx-auto shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-accent text-white font-bold flex items-center justify-center text-xs">
                        TQ
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">TechQuo News</span>
                        <span className="text-[10px] text-slate-400">Media & News Publishing</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="aspect-[1.91/1] w-full bg-slate-900 overflow-hidden">
                        <img 
                          src={image} 
                          alt={title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
                          }}
                        />
                      </div>
                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">www.techquonews.com</span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">{title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{truncatedExcerpt}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Copy Link Section */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Direct Article Link
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-slate-700 font-mono focus:outline-none select-all"
                  />
                  <Globe size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                    copied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-slate-900 text-white hover:bg-brand-accent"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Native Share Button if available */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <Smartphone size={16} />
                <span>Open Device Share Menu (AirDrop, Messages, etc.)</span>
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-brand-accent" />
              SEO & Social Card tags automatically embedded for all platforms
            </span>
            <button
              onClick={onClose}
              className="font-bold text-slate-700 hover:text-slate-950"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
