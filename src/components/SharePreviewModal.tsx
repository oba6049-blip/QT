import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  MessageCircle,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  Mail,
  Smartphone,
  Globe,
  ImageIcon
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
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Normalize image URL
  const resolvedImage = (() => {
    if (!image) return "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200";
    if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) {
      return image;
    }
    if (typeof window !== "undefined" && image.startsWith("/")) {
      return `${window.location.origin}${image}`;
    }
    return image;
  })();

  useEffect(() => {
    if (isOpen) {
      setImgError(false);
      setImgLoaded(false);
    }
  }, [isOpen, resolvedImage]);

  if (!isOpen) return null;

  const fullUrl = url.startsWith("http") 
    ? url 
    : `https://www.techquonews.com${url.startsWith("/") ? url : `/${url}`}`;

  const cleanExcerpt = (description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const truncatedExcerpt = cleanExcerpt.length > 150 
    ? `${cleanExcerpt.slice(0, 147)}...` 
    : cleanExcerpt;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback for older environments
        const textArea = document.createElement("textarea");
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: truncatedExcerpt,
          url: fullUrl,
        });
      } catch {
        // User cancelled or share aborted
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Share Intent URLs
  const shareText = type === "spotlight"
    ? `Founder Spotlight: ${title} | TechQuo News`
    : `${title} | TechQuo News`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}&via=TechQuoNews`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`[TechQuo News] ${title}`)}&body=${encodeURIComponent(`I thought you might find this article interesting:\n\n${title}\n\n${truncatedExcerpt}\n\nRead full story: ${fullUrl}`)}`;

  const displayBadge = type === "spotlight"
    ? "FOUNDER SPOTLIGHT"
    : (categoryOrFounder || "TECH REPORT").toUpperCase();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-800">
                <Share2 size={16} />
              </div>
              <div>
                <h3 className="text-base font-editorial font-bold text-slate-900 leading-none">Share Story</h3>
                <p className="text-xs text-slate-500 mt-1">Distribute across networks with rich metadata preview</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Close share modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* High-Fidelity Rich Story Preview Card */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Preview Card
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  www.techquonews.com
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-xs hover:border-slate-300 transition-colors">
                {/* Feature Image Area */}
                <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  {!imgLoaded && !imgError && (
                    <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center text-slate-600">
                      <ImageIcon size={28} />
                    </div>
                  )}
                  <img 
                    src={imgError ? "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=1200" : resolvedImage} 
                    alt={title} 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoaded(true)}
                    onError={() => {
                      setImgError(true);
                      setImgLoaded(true);
                    }}
                  />

                  {/* Gradient Overlay & Watermark */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Category / Spotlight Badge */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm border border-white/10 shadow-xs">
                    {displayBadge}
                  </div>

                  {/* TechQuo News Watermark */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5 border border-white/10 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                    <span>TechQuo News</span>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="p-4 space-y-2 bg-white border-t border-slate-100">
                  <h4 className="text-base font-editorial font-bold text-slate-900 leading-snug line-clamp-2">
                    {title}
                  </h4>
                  {truncatedExcerpt && (
                    <p className="text-xs text-slate-600 font-serif leading-relaxed line-clamp-2">
                      {truncatedExcerpt}
                    </p>
                  )}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                    <span className="font-semibold text-slate-600">
                      {authorName ? `By ${authorName}` : "TechQuo Editorial"}
                    </span>
                    <span className="font-mono text-slate-400">techquonews.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Share Action Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Share to Network
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70 transition-all group"
                  title="Share via WhatsApp"
                >
                  <MessageCircle size={20} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">WhatsApp</span>
                </a>

                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-slate-900 text-white hover:bg-black border border-slate-800 transition-all group"
                  title="Post to X / Twitter"
                >
                  <Twitter size={20} className="text-white group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">X (Twitter)</span>
                </a>

                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/70 transition-all group"
                  title="Post to LinkedIn"
                >
                  <Linkedin size={20} className="text-blue-700 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">LinkedIn</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/70 transition-all group"
                  title="Share on Facebook"
                >
                  <Facebook size={20} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">Facebook</span>
                </a>

                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/70 transition-all group"
                  title="Share via Telegram"
                >
                  <Send size={20} className="text-sky-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">Telegram</span>
                </a>

                <a
                  href={emailUrl}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/70 transition-all group"
                  title="Share via Email"
                >
                  <Mail size={20} className="text-amber-700 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-bold">Email</span>
                </a>
              </div>
            </div>

            {/* Direct Copy Link Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Story Link
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={fullUrl}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-3.5 pr-9 text-xs text-slate-700 font-mono focus:outline-none focus:border-slate-400 select-all"
                  />
                  <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-xs transition-all shrink-0 cursor-pointer shadow-xs ${
                    copied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-slate-900 text-white hover:bg-black"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      <span>Copied</span>
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

            {/* Mobile / Desktop Native Share Sheet if available */}
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 cursor-pointer"
              >
                <Smartphone size={15} />
                <span>Open Device Share Menu</span>
              </button>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>TechQuo News Editorial Publishing</span>
            <button
              onClick={onClose}
              className="font-bold text-slate-700 hover:text-slate-950 px-3 py-1 rounded hover:bg-slate-200/60 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

