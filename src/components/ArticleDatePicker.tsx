import { useState, useEffect } from 'react';
import { Calendar, Clock, RotateCcw, Sparkles, Check, History } from 'lucide-react';

interface ArticleDatePickerProps {
  date: string;
  publishedAt?: string;
  onChange: (result: { date: string; publishedAt: string }) => void;
  label?: string;
}

export default function ArticleDatePicker({
  date,
  publishedAt,
  onChange,
  label = "Publication Date & Backdating",
}: ArticleDatePickerProps) {
  // Helper to format ISO or string date to YYYY-MM-DD for <input type="date">
  const getInputValue = (): string => {
    if (publishedAt) {
      const d = new Date(publishedAt);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    }
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    }
    return new Date().toISOString().split("T")[0];
  };

  const [dateInputValue, setDateInputValue] = useState<string>(getInputValue());
  const [isBackdatingMode, setIsBackdatingMode] = useState(false);

  // Sync state if external date prop changes
  useEffect(() => {
    setDateInputValue(getInputValue());
  }, [date, publishedAt]);

  const handleDateChange = (newDateVal: string) => {
    setDateInputValue(newDateVal);
    if (!newDateVal) {
      const now = new Date();
      onChange({
        date: now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        publishedAt: now.toISOString(),
      });
      return;
    }

    const [year, month, day] = newDateVal.split("-").map(Number);
    // Use midday to avoid timezone day boundary shifts
    const d = new Date(year, month - 1, day, 12, 0, 0);
    const displayDate = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const iso = d.toISOString();

    onChange({
      date: displayDate,
      publishedAt: iso,
    });
  };

  const applyPreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(12, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    handleDateChange(dateStr);
  };

  const isToday = (): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return dateInputValue === today;
  };

  const isPast = (): boolean => {
    const today = new Date().toISOString().split("T")[0];
    return Boolean(dateInputValue && dateInputValue < today);
  };

  return (
    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Calendar size={14} className="text-brand-accent" />
          {label}
        </label>
        
        {isPast() ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <History size={11} /> Backdated Dispatch
          </span>
        ) : isToday() ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check size={11} /> Today's Issue
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock size={11} /> Future / Scheduled
          </span>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <div>
          <input
            type="date"
            value={dateInputValue}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-3 bg-white border border-slate-300 font-mono text-sm focus:outline-none focus:border-black rounded-none shadow-xs"
          />
        </div>

        <div className="bg-white p-3 border border-slate-200 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
            Public Display Date
          </span>
          <p className="font-serif font-bold text-slate-900 text-sm truncate">
            {date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Quick Backdate Presets */}
      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between flex-wrap gap-2">
        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <History size={12} className="text-slate-400" />
          Quick Select:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => applyPreset(0)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
              isToday()
                ? "bg-black text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyPreset(1)}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => applyPreset(7)}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            1 Week Ago
          </button>
          <button
            type="button"
            onClick={() => applyPreset(30)}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            1 Month Ago
          </button>
          <button
            type="button"
            onClick={() => applyPreset(365)}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            1 Year Ago
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-normal">
        Setting a past date backdates the dispatch across all archives, category feeds, RSS feeds, and search indexes without altering editorial timestamps.
      </p>
    </div>
  );
}
