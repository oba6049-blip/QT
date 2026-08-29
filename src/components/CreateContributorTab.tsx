import React, { useState } from 'react';
import { Contributor } from '../types';
import { createContributor } from '../services/contributorService';
import { UserCheck, Upload, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Sparkles, ExternalLink, Link as LinkIcon, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CreateContributorTabProps {
  onSuccess?: (contributor: Contributor) => void;
  onNavigateManage?: () => void;
}

export default function CreateContributorTab({ onSuccess, onNavigateManage }: CreateContributorTabProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [longBio, setLongBio] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertiseList, setExpertiseList] = useState<string[]>(['Fintech', 'Venture Capital']);
  
  // Social links
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');

  const generateSlugFromName = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isCustomSlug) {
      setSlug(generateSlugFromName(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustomSlug(true);
    setSlug(generateSlugFromName(e.target.value));
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertiseList.includes(expertiseInput.trim())) {
      setExpertiseList([...expertiseList, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (tagToRemove: string) => {
    setExpertiseList(expertiseList.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data, name: file.name, folder: 'contributors' }),
        });

        if (res.ok) {
          const data = await res.json();
          setProfileImage(data.url || base64Data);
        } else {
          setProfileImage(base64Data);
        }
      } catch (err) {
        console.warn('Upload fallback to data url:', err);
        setProfileImage(base64Data);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the contributor full name.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a professional title / designation.');
      return;
    }
    if (!bio.trim()) {
      setError('Please write a short biography for this contributor.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const finalSlug = slug.trim() || generateSlugFromName(name);
      const contributorPayload: Partial<Contributor> = {
        name: name.trim(),
        slug: finalSlug,
        title: title.trim(),
        bio: bio.trim(),
        longBio: longBio.trim() || undefined,
        email: email.trim() || undefined,
        showEmail,
        profileImage: profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        status,
        expertise: expertiseList,
        socialLinks: {
          linkedin: linkedin.trim() || undefined,
          twitter: twitter.trim() || undefined,
          website: website.trim() || undefined,
          github: github.trim() || undefined,
        },
      };

      const result = await createContributor(contributorPayload);
      setSuccess(true);
      setCreatedSlug(finalSlug);

      if (onSuccess && result) {
        onSuccess(result);
      }

      // Reset form
      setName('');
      setSlug('');
      setIsCustomSlug(false);
      setTitle('');
      setBio('');
      setLongBio('');
      setEmail('');
      setShowEmail(false);
      setProfileImage('');
      setLinkedin('');
      setTwitter('');
      setWebsite('');
      setGithub('');
    } catch (err: any) {
      setError(err.message || 'Failed to create contributor profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent block mb-1">
            Editorial Network
          </span>
          <h2 className="text-2xl font-editorial font-bold text-slate-900">
            Add New Contributor Profile
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Register an author or industry analyst to link their articles, bio, and social presence.
          </p>
        </div>
        {onNavigateManage && (
          <button
            type="button"
            onClick={onNavigateManage}
            className="text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded transition-colors"
          >
            Manage Contributors
          </button>
        )}
      </div>

      {success && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Contributor Profile Created!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                The author has been added to the editorial database and can now be attached to articles.
              </p>
              {createdSlug && (
                <div className="mt-3 flex items-center gap-3">
                  <Link
                    to={`/contributors/${createdSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
                  >
                    View Public Profile Page <ExternalLink size={12} />
                  </Link>
                  {onNavigateManage && (
                    <button
                      type="button"
                      onClick={onNavigateManage}
                      className="text-xs font-bold text-slate-700 hover:text-black underline"
                    >
                      Manage All Contributors
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-sm flex items-start gap-3">
          <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Action Failed</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Profile Details */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <UserCheck size={16} className="text-brand-accent" />
            Basic Contributor Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Hafsat Itanola"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Unique Profile Slug
              </label>
              <div className="flex items-center">
                <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-3 text-xs text-slate-500 rounded-l font-mono">
                  /contributors/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="oladosu-ibrahim"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r text-sm focus:outline-none focus:border-black font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Auto-generated from name. Used for clean URLs: techquonews.com/contributors/{slug || 'name'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Professional Title / Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Tech Journalist & Policy Analyst"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black font-medium"
              >
                <option value="active">Active (Visible in bylines and directory)</option>
                <option value="inactive">Inactive (Archived contributor)</option>
              </select>
            </div>
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Profile Photo
            </label>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon size={28} />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                    <Loader2 size={18} className="animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-brand-accent transition-colors">
                    <Upload size={14} />
                    {uploading ? 'Uploading...' : 'Upload Avatar'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage('')}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Short Biography (Editorial Byline Bio) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A concise 2-3 sentence overview of the author's background, focus areas, and journalistic beat."
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Displayed on article byline cards and profile page preview header.
            </p>
          </div>

          {/* Long Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Extended Biography (Optional)
            </label>
            <textarea
              rows={5}
              value={longBio}
              onChange={(e) => setLongBio(e.target.value)}
              placeholder="In-depth background, career accomplishments, previous publications, education, and areas of research."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Areas of Expertise */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-accent" />
            Areas of Expertise & Beats
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddExpertise();
                }
              }}
              placeholder="e.g. Artificial Intelligence, Digital Banking, Venture Capital"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
            />
            <button
              type="button"
              onClick={handleAddExpertise}
              className="px-4 py-2.5 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-brand-accent transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Add Beat
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {expertiseList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-medium rounded-full border border-slate-200"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveExpertise(tag)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="bg-white p-6 border border-slate-200 rounded-sm shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <LinkIcon size={16} className="text-brand-accent" />
            Contact & Social Profiles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contributor@techquonews.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="showEmailCheck"
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
                />
                <label htmlFor="showEmailCheck" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Display contact email publicly on author profile
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                X / Twitter URL
              </label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Personal Website or Portfolio
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://mywebsite.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex items-center gap-2 bg-black hover:bg-brand-accent text-white px-8 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <UserCheck size={16} />
                Create Contributor Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
