import React, { useState, useEffect } from 'react';
import { Contributor } from '../types';
import { getContributors } from '../services/contributorService';
import { Users, Check, ChevronDown, UserPlus, X } from 'lucide-react';

interface ContributorSelectProps {
  selectedContributorId?: string;
  authorName?: string;
  onSelect: (contributor: Contributor | null) => void;
  onNavigateCreateContributor?: () => void;
}

export default function ContributorSelect({
  selectedContributorId,
  authorName,
  onSelect,
  onNavigateCreateContributor,
}: ContributorSelectProps) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await getContributors('active');
        setContributors(list);
      } catch (e) {
        console.error('Failed to load contributors', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedContributor = contributors.find(
    (c) => (c.id === selectedContributorId || c._id === selectedContributorId) ||
           (authorName && c.name.toLowerCase() === authorName.toLowerCase())
  );

  const filtered = contributors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-brand-accent" />
          Assign Contributor / Author Profile
        </span>
        {onNavigateCreateContributor && (
          <button
            type="button"
            onClick={onNavigateCreateContributor}
            className="text-[11px] font-bold text-brand-accent hover:underline lowercase tracking-normal flex items-center gap-1"
          >
            <UserPlus size={12} /> + new contributor
          </button>
        )}
      </label>

      {/* Selected Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[48px] px-3.5 py-2 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:border-slate-400 transition-colors flex items-center justify-between"
      >
        {selectedContributor ? (
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <img
              src={selectedContributor.profileImage || selectedContributor.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
              alt={selectedContributor.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                {selectedContributor.name}
              </span>
              <span className="text-[11px] text-slate-500 block truncate leading-tight">
                {selectedContributor.title}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            {loading ? 'Loading contributors...' : 'Select a contributor from database...'}
          </span>
        )}

        <div className="flex items-center gap-1 ml-2">
          {selectedContributor && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="p-1 text-slate-400 hover:text-rose-600 rounded"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-30 max-h-64 flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter contributors by name or beat..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-black"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No active contributors found.
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = selectedContributor?.id === c.id || selectedContributor?._id === c.id;
                return (
                  <div
                    key={c.id || c._id}
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-slate-100/80 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={c.profileImage || c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                        alt={c.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <span className="text-xs text-slate-900 block truncate leading-tight font-medium">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate leading-tight">
                          {c.title}
                        </span>
                      </div>
                    </div>

                    {isSelected && <Check size={14} className="text-brand-accent shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
