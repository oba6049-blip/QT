import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpotlightStory } from '../types';
import { updateSpotlightStory } from '../services/spotlightService';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Edit3, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface EditSpotlightModalProps {
  story: SpotlightStory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStory: SpotlightStory) => void;
}

export default function EditSpotlightModal({
  story,
  isOpen,
  onClose,
  onSuccess,
}: EditSpotlightModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    founderName: '',
    companyName: '',
    title: '',
    story: '',
    image: '',
    link: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (story) {
      setFormData({
        founderName: story.founderName || '',
        companyName: story.companyName || '',
        title: story.title || '',
        story: story.story || '',
        image: story.image || '',
        link: story.link || '',
      });
      setImageFile(null);
      setImagePreview(story.image || null);
      setError(null);
      setSuccess(false);
    }
  }, [story, isOpen]);

  if (!isOpen || !story) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToBackend = async (file: File): Promise<string> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          filename: file.name,
          contentType: file.type,
          folder: 'spotlight'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.url || base64;
      }
      return base64;
    } catch {
      return base64;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story) return;

    if (!formData.founderName.trim()) {
      setError('Founder Name is required');
      return;
    }
    if (!formData.companyName.trim()) {
      setError('Company Name is required');
      return;
    }
    if (!formData.title.trim()) {
      setError('Spotlight Title is required');
      return;
    }
    if (!formData.story.trim()) {
      setError('Spotlight Story narrative is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let finalImageUrl = formData.image;

      if (imageFile) {
        setUploading(true);
        setUploadProgress(20);
        try {
          finalImageUrl = await uploadImageToBackend(imageFile);
          setUploadProgress(100);
        } finally {
          setUploading(false);
        }
      }

      const updatedPayload: Partial<SpotlightStory> = {
        founderName: formData.founderName,
        companyName: formData.companyName,
        title: formData.title,
        story: formData.story,
        image: finalImageUrl,
        link: formData.link,
      };

      const ok = await updateSpotlightStory(story.id, updatedPayload);
      if (!ok) {
        throw new Error('Failed to update spotlight story.');
      }

      setSuccess(true);
      const fullyUpdated: SpotlightStory = {
        ...story,
        ...updatedPayload,
        image: finalImageUrl,
      };

      setTimeout(() => {
        onSuccess(fullyUpdated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Error updating spotlight story');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        id="edit-spotlight-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 shadow-2xl rounded-sm w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold">
                <Edit3 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-editorial font-bold text-slate-900">
                  Edit Founder Spotlight
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Update narrative text, headline, links, and portrait
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-black hover:bg-slate-200 rounded-full transition-colors"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 bg-emerald-50 text-emerald-800 flex items-center gap-3 text-sm font-bold border border-emerald-200 rounded-sm shadow-2xs"
              >
                <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                <span>Spotlight story updated successfully! Refreshing dashboard...</span>
              </motion.div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-200 rounded-sm">
                <AlertCircle size={20} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form id="edit-spotlight-form" onSubmit={handleSave} className="space-y-6">
              {/* Founder Name & Company Name */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="editorial-label">Founder Name</label>
                  <input
                    required
                    type="text"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-sm outline-hidden focus:border-black font-serif text-base"
                    placeholder="e.g. Aliko Dangote"
                    value={formData.founderName}
                    onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="editorial-label">Company Name</label>
                  <input
                    required
                    type="text"
                    className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-sm outline-hidden focus:border-black text-sm"
                    placeholder="e.g. Dangote Group"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
              </div>

              {/* Title / Headline */}
              <div className="space-y-2">
                <label className="editorial-label">Spotlight Headline / Quote Title</label>
                <input
                  required
                  type="text"
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-sm outline-hidden focus:border-black font-serif text-base"
                  placeholder="e.g. Redefining Industrialization in Africa"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* External Feature Link */}
              <div className="space-y-2">
                <label className="editorial-label flex items-center gap-1.5">
                  <LinkIcon size={12} />
                  <span>Website or Article Feature Link (Optional)</span>
                </label>
                <input
                  type="url"
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-sm outline-hidden focus:border-black text-sm font-mono"
                  placeholder="https://..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="editorial-label">Spotlight Portrait / Visual</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors relative overflow-hidden group rounded-md"
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Upload size={28} />
                        <span className="text-xs font-bold uppercase tracking-wider mt-1">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-slate-400 mb-2" size={32} />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Upload Spotlight Image
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>

              {/* Rich Text Narrative */}
              <div className="space-y-2">
                <label className="editorial-label flex items-center justify-between">
                  <span>Founder's Narrative Story (Rich Text)</span>
                  <span className="text-[10px] text-slate-500 font-normal uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={12} className="text-brand-accent" />
                    Full Rich Text Enabled
                  </span>
                </label>
                <RichTextEditor
                  content={formData.story}
                  onChange={(story) => setFormData({ ...formData, story })}
                  placeholder="Edit the founder's story, journey, insights, quotes, headers, and media embeds..."
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
              className="px-5 py-2.5 border border-slate-300 bg-white text-slate-700 font-bold uppercase text-xs tracking-wider hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="edit-spotlight-form"
              disabled={loading || uploading}
              className="px-6 py-2.5 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center gap-2 shadow-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Uploading Image ({Math.round(uploadProgress)}%)...</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving Spotlight...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
