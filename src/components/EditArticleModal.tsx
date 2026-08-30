import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../types';
import { updateArticle } from '../services/articleService';
import { CATEGORIES } from '../constants';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  ExternalLink, 
  Edit3, 
  History, 
  Sparkles,
  Link as LinkIcon,
  Tag
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import ContributorSelect from './ContributorSelect';
import ArticleDatePicker from './ArticleDatePicker';

interface EditArticleModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedArticle: Article) => void;
}

export default function EditArticleModal({
  article,
  isOpen,
  onClose,
  onSuccess,
}: EditArticleModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category: CATEGORIES[0].name,
    author: '',
    authorDesignation: 'Contributor',
    contributorId: '',
    authorImage: '',
    date: '',
    publishedAt: '',
    readTime: '5 min',
    image: '',
    featured: false,
    trending: false,
    tags: '',
    content: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sync state when article prop changes
  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        slug: article.slug || '',
        excerpt: article.excerpt || '',
        category: article.category || CATEGORIES[0].name,
        author: article.author || '',
        authorDesignation: article.authorDesignation || 'Contributor',
        contributorId: article.contributorId || article.contributor?.id || article.contributor?._id || '',
        authorImage: article.authorImage || '',
        date: article.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        publishedAt: article.publishedAt || (article.date ? new Date(article.date).toISOString() : new Date().toISOString()),
        readTime: article.readTime || '5 min',
        image: article.image || '',
        featured: Boolean(article.featured),
        trending: Boolean(article.trending),
        tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
        content: article.content || '',
      });
      setImageFile(null);
      setImagePreview(article.image || null);
      setError(null);
      setSuccess(false);
    }
  }, [article, isOpen]);

  if (!isOpen || !article) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setUploadProgress(20);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadProgress(50);
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, name: file.name, folder: 'editorial' }),
          });
          setUploadProgress(85);
          if (res.ok) {
            const data = await res.json();
            setUploadProgress(100);
            resolve(data.url || base64Data);
          } else {
            setUploadProgress(100);
            resolve(base64Data);
          }
        } catch (err) {
          setUploadProgress(100);
          resolve(base64Data);
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      let finalImageUrl = formData.image;

      if (imageFile) {
        setUploading(true);
        try {
          finalImageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!finalImageUrl) {
        throw new Error('Please provide an image for the article.');
      }

      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Partial<Article> = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        category: formData.category,
        author: formData.author.trim(),
        authorDesignation: formData.authorDesignation.trim(),
        contributorId: formData.contributorId,
        authorImage: formData.authorImage,
        date: formData.date,
        publishedAt: formData.publishedAt,
        readTime: formData.readTime.trim(),
        image: finalImageUrl,
        featured: formData.featured,
        trending: formData.trending,
        tags: tagsArray,
        content: formData.content,
      };

      const articleId = article.id || (article as any)._id;
      const successResult = await updateArticle(articleId, payload);

      if (!successResult) {
        throw new Error('Server returned an error while saving article updates.');
      }

      setSuccess(true);
      const mergedArticle: Article = {
        ...article,
        ...payload,
      };

      onSuccess(mergedArticle);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update article.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const categorySlug = (formData.category || 'technology')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const articleSlug = formData.slug || article.slug || article.id;
  const liveUrl = `/${categorySlug}/${articleSlug}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white max-w-4xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center rounded-sm shrink-0">
              <Edit3 size={18} />
            </div>
            <div>
              <h2 className="text-xl font-editorial font-bold text-slate-900 leading-tight">
                Edit Published Article
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                ID: {article.id || (article as any)._id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold uppercase tracking-wider transition-colors"
              title="Preview story in new tab"
            >
              <ExternalLink size={13} />
              <span>Live Article</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-black transition-colors rounded-sm hover:bg-slate-200/60"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 text-emerald-800 flex items-center gap-3 text-sm font-bold border border-emerald-200 rounded"
            >
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              Article updated successfully! Changes are live across all feeds.
            </motion.div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-800 flex items-center gap-3 text-sm font-bold border border-red-200 rounded">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              {error}
            </div>
          )}

          <form id="edit-article-form" onSubmit={handleSave} className="space-y-6">
            {/* Title & Category */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="editorial-label">Story Headline</label>
                <input
                  required
                  type="text"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent font-serif text-lg text-slate-900 rounded-none"
                  placeholder="Story headline..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="editorial-label">Topic / Category</label>
                <select
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent uppercase text-xs font-bold tracking-widest text-slate-800 rounded-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Slug */}
            <div className="space-y-1">
              <label className="editorial-label flex items-center gap-1.5">
                <LinkIcon size={12} className="text-slate-400" />
                URL Slug (Permanent Permalink)
              </label>
              <input
                type="text"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:border-black"
                placeholder="e.g. nigeria-fintech-startup-funding-2026"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Live URL: <code className="text-slate-600">{liveUrl}</code>
              </p>
            </div>

            {/* Contributor Profile Selector */}
            <div className="p-4 bg-slate-100/70 border border-slate-200 rounded">
              <ContributorSelect
                selectedContributorId={formData.contributorId}
                authorName={formData.author}
                onSelect={(c) => {
                  if (c) {
                    setFormData({
                      ...formData,
                      contributorId: c.id || (c as any)._id || '',
                      author: c.name,
                      authorDesignation: c.title || 'Contributor',
                      authorImage: c.profileImage || c.avatar || '',
                    });
                  } else {
                    setFormData({
                      ...formData,
                      contributorId: '',
                    });
                  }
                }}
              />
            </div>

            {/* Author Name and Designation */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="editorial-label">Byline Author Name</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent text-sm"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="editorial-label">Author Title / Designation</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent text-sm"
                  value={formData.authorDesignation}
                  onChange={(e) => setFormData({ ...formData, authorDesignation: e.target.value })}
                />
              </div>
            </div>

            {/* Publication Date & Backdate Picker */}
            <ArticleDatePicker
              date={formData.date}
              publishedAt={formData.publishedAt}
              onChange={({ date, publishedAt }) => {
                setFormData({
                  ...formData,
                  date,
                  publishedAt,
                });
              }}
              label="Article Publication Date & Backdating"
            />

            {/* Brief Excerpt */}
            <div className="space-y-2">
              <label className="editorial-label">Subheadline / Brief Excerpt</label>
              <textarea
                required
                rows={2}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent text-slate-700 text-sm leading-relaxed"
                placeholder="Story summary for front page previews..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </div>

            {/* Featured Image & Read Time */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="editorial-label">Featured Story Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors relative overflow-hidden group"
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Upload size={24} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Replace Image
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-slate-400 mb-2" size={32} />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Click to upload new image
                      </p>
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
                {imageFile && (
                  <p className="text-[11px] font-bold text-slate-600 font-mono">
                    New file selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="editorial-label">Estimated Read Time</label>
                  <input
                    required
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent text-sm"
                    placeholder="e.g. 6 min read"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="editorial-label flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-400" />
                    Keywords & Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-accent text-xs font-mono"
                    placeholder="Fintech, Venture Capital, Nigeria, AI"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer bg-slate-50 p-2.5 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-black border-slate-300"
                    />
                    <span>Hero Featured</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer bg-slate-50 p-2.5 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.trending}
                      onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                      className="w-4 h-4 text-black border-slate-300"
                    />
                    <span>Trending Feed</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <label className="editorial-label">Full Article Story Content</label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Edit article text, quotes, headers, and media embeds..."
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors"
          >
            Discard Changes
          </button>

          <button
            type="submit"
            form="edit-article-form"
            disabled={loading || uploading}
            className="px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={15} />
                Uploading Visual ({Math.round(uploadProgress)}%)...
              </>
            ) : loading ? (
              <>
                <Loader2 className="animate-spin" size={15} />
                Saving Changes...
              </>
            ) : (
              'Save & Update Story'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
