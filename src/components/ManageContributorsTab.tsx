import React, { useState, useEffect } from 'react';
import { Contributor } from '../types';
import { getContributors, updateContributor, deleteContributor } from '../services/contributorService';
import { 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Linkedin, 
  Twitter, 
  Globe, 
  Mail, 
  X,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ContributorPhotoUploader from './ContributorPhotoUploader';

const formatDateForInput = (dateVal?: string): string => {
  if (!dateVal) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const formatJoinedDateDisplay = (dateVal?: string): string => {
  if (!dateVal) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    const d = new Date(dateVal + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

interface ManageContributorsTabProps {
  onNavigateCreate?: () => void;
}

export default function ManageContributorsTab({ onNavigateCreate }: ManageContributorsTabProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'staff' | 'guest'>('all');
  
  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit modal state
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContributorsList = async () => {
    setLoading(true);
    try {
      const data = await getContributors('all');
      setContributors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contributors list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributorsList();
  }, []);

  const handleOpenEdit = (contributor: Contributor) => {
    setEditingContributor({ ...contributor });
    setError(null);
    setSuccessMsg(null);
  };

  const handleCloseEdit = () => {
    setEditingContributor(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContributor) return;

    setEditLoading(true);
    setError(null);
    try {
      const targetId = editingContributor.id || editingContributor._id || '';
      const updated = await updateContributor(targetId, editingContributor);
      if (updated) {
        setContributors((prev) =>
          prev.map((c) => ((c.id === targetId || c._id === targetId) ? { ...c, ...updated } : c))
        );
        setSuccessMsg(`Contributor profile for "${updated.name}" updated successfully.`);
        setEditingContributor(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update contributor');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    setError(null);
    try {
      const ok = await deleteContributor(deletingId);
      if (ok) {
        setContributors((prev) => prev.filter((c) => c.id !== deletingId && c._id !== deletingId));
        setSuccessMsg('Contributor deleted successfully.');
        setDeletingId(null);
      } else {
        setError('Could not delete contributor.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting contributor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered contributors
  const filteredContributors = contributors.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || (c.contributorType || 'staff') === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.expertise?.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent block mb-1">
            Editorial Management
          </span>
          <h2 className="text-2xl font-editorial font-bold text-slate-900">
            Manage Contributors & Authors
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Directory of all registered writers, analysts, and contributors across TechQuo News.
          </p>
        </div>

        {onNavigateCreate && (
          <button
            type="button"
            onClick={onNavigateCreate}
            className="inline-flex items-center gap-2 bg-black hover:bg-brand-accent text-white px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus size={14} /> Add Contributor
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-emerald-600 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-rose-800 font-medium">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-600 hover:text-rose-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-sm shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by author name, title, beats, or slug..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Classification Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type:</span>
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  typeFilter === 'all' ? 'bg-white text-black shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                All Types
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('staff')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  typeFilter === 'staff' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                Staff ({contributors.filter((c) => (c.contributorType || 'staff') === 'staff').length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('guest')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  typeFilter === 'guest' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                Guests ({contributors.filter((c) => c.contributorType === 'guest').length})
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-black shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                Active ({contributors.filter((c) => c.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1.5 rounded-sm font-medium transition-colors ${
                  statusFilter === 'inactive' ? 'bg-white text-slate-700 shadow-xs font-bold' : 'text-slate-600 hover:text-black'
                }`}
              >
                Inactive ({contributors.filter((c) => c.status === 'inactive').length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contributor List / Table */}
      {loading ? (
        <div className="bg-white p-12 border border-slate-200 rounded-sm text-center">
          <Loader2 size={24} className="animate-spin mx-auto text-slate-400 mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading contributors directory...</p>
        </div>
      ) : filteredContributors.length === 0 ? (
        <div className="bg-white p-12 border border-slate-200 rounded-sm text-center">
          <Users size={32} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No contributors found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No contributors matched "${searchQuery}". Try a different search.`
              : 'Start by creating your first contributor profile.'}
          </p>
          {onNavigateCreate && (
            <button
              type="button"
              onClick={onNavigateCreate}
              className="mt-4 inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-brand-accent transition-colors"
            >
              <Plus size={14} /> Add Contributor Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Contributor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Beats / Topics</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredContributors.map((c) => {
                  const slug = c.slug || c.id;
                  const profileImg = c.profileImage || c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';
                  const isGuest = c.contributorType === 'guest';
                  return (
                    <tr key={c.id || c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={profileImg}
                            alt={c.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">/contributors/{slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isGuest ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                            Guest
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
                            Staff
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        <span className="truncate block">{c.title || (isGuest ? 'Guest Contributor' : 'Staff Writer')}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{formatJoinedDateDisplay(c.joinedAt)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {c.totalArticles ?? 0} {c.totalArticles === 1 ? 'article' : 'articles'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.expertise && c.expertise.length > 0 ? (
                            c.expertise.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                          {c.expertise && c.expertise.length > 3 && (
                            <span className="text-slate-400 text-[10px]">+{c.expertise.length - 3}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/contributors/${slug}`}
                            target="_blank"
                            title="View Public Profile"
                            className="p-1.5 text-slate-400 hover:text-black hover:bg-slate-100 rounded transition-colors"
                          >
                            <ExternalLink size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Contributor"
                            className="p-1.5 text-slate-400 hover:text-brand-accent hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(c.id || c._id || null)}
                            title="Delete Contributor"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Contributor Modal */}
      {editingContributor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-editorial font-bold text-slate-900">
                Edit Contributor: {editingContributor.name}
              </h3>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-black p-1 rounded transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editingContributor.name}
                    onChange={(e) => setEditingContributor({ ...editingContributor, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editingContributor.slug}
                    onChange={(e) => setEditingContributor({ ...editingContributor, slug: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              {/* Contributor Classification (Staff vs Guest) */}
              <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
                  Contributor Classification
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => {
                      setEditingContributor({ ...editingContributor, contributorType: 'staff' });
                    }}
                    className={`p-3 border rounded cursor-pointer transition-all flex items-start gap-2.5 ${
                      (editingContributor.contributorType || 'staff') === 'staff'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editContributorType"
                      value="staff"
                      checked={(editingContributor.contributorType || 'staff') === 'staff'}
                      onChange={() => {}}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Staff Contributor</span>
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-bold rounded">
                          In-House Staff
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        TechQuo newsroom journalist or staff writer.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setEditingContributor({ ...editingContributor, contributorType: 'guest' });
                    }}
                    className={`p-3 border rounded cursor-pointer transition-all flex items-start gap-2.5 ${
                      editingContributor.contributorType === 'guest'
                        ? 'border-amber-600 bg-amber-50/50 shadow-2xs ring-1 ring-amber-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editContributorType"
                      value="guest"
                      checked={editingContributor.contributorType === 'guest'}
                      onChange={() => {}}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Guest Contributor</span>
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                          External Writer
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                        Guest analyst, industry expert, or submitted opinion piece.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={editingContributor.title}
                    onChange={(e) => setEditingContributor({ ...editingContributor, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>Joined Date</span>
                    <span className="text-[10px] text-slate-400 font-normal normal-case">Backdate</span>
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(editingContributor.joinedAt)}
                    onChange={(e) => setEditingContributor({ ...editingContributor, joinedAt: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingContributor.status}
                    onChange={(e) => setEditingContributor({ ...editingContributor, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Photo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Profile Photo (Stored in AWS S3 & MongoDB)
                </label>
                <ContributorPhotoUploader
                  value={editingContributor.profileImage || editingContributor.avatar || ''}
                  onChange={(newUrl) => setEditingContributor({
                    ...editingContributor,
                    profileImage: newUrl,
                    avatar: newUrl
                  })}
                  contributorName={editingContributor.name || 'contributor'}
                  disabled={editLoading}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Short Biography
                </label>
                <textarea
                  rows={3}
                  value={editingContributor.bio}
                  onChange={(e) => setEditingContributor({ ...editingContributor, bio: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black leading-relaxed"
                />
              </div>

              {/* Long Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Extended Biography (Optional)
                </label>
                <textarea
                  rows={4}
                  value={editingContributor.longBio || ''}
                  onChange={(e) => setEditingContributor({ ...editingContributor, longBio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black leading-relaxed"
                />
              </div>

              {/* Socials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={editingContributor.socialLinks?.linkedin || ''}
                    onChange={(e) =>
                      setEditingContributor({
                        ...editingContributor,
                        socialLinks: { ...editingContributor.socialLinks, linkedin: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">X / Twitter URL</label>
                  <input
                    type="url"
                    value={editingContributor.socialLinks?.twitter || ''}
                    onChange={(e) =>
                      setEditingContributor({
                        ...editingContributor,
                        socialLinks: { ...editingContributor.socialLinks, twitter: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={editingContributor.socialLinks?.website || ''}
                    onChange={(e) =>
                      setEditingContributor({
                        ...editingContributor,
                        socialLinks: { ...editingContributor.socialLinks, website: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingContributor.email || ''}
                    onChange={(e) => setEditingContributor({ ...editingContributor, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-black rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-black hover:bg-brand-accent text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-sm shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} />
            </div>
            <h3 className="text-lg font-editorial font-bold text-slate-900 mb-2">Delete Contributor?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this contributor? Articles previously authored by them will remain published, but will no longer link to this profile.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-black bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
