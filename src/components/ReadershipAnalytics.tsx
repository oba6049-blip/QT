import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Activity,
  UserCheck,
  Building2,
  PieChart as PieChartIcon
} from "lucide-react";
import { fetchPlatformAnalytics } from "../services/analyticsService";
import { PlatformAnalyticsOverview, SectionAnalytics, ArticleReadershipItem } from "../types";

interface ReadershipAnalyticsProps {
  onEditArticle?: (id: string) => void;
  onEditSpotlight?: (id: string) => void;
}

export default function ReadershipAnalytics({ onEditArticle, onEditSpotlight }: ReadershipAnalyticsProps) {
  const [data, setData] = useState<PlatformAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"views-desc" | "views-asc" | "newest" | "title">("views-desc");
  const [dayRange, setDayRange] = useState<7 | 14 | 30>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "sections" | "spotlights" | "daily">("overview");

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const overview = await fetchPlatformAnalytics();
      setData(overview);
    } catch (err: any) {
      setError(err.message || "Failed to fetch readership analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered daily history
  const displayedDailyHistory = useMemo(() => {
    if (!data?.dailyHistory) return [];
    return data.dailyHistory.slice(-dayRange);
  }, [data?.dailyHistory, dayRange]);

  // Max daily views for scaling chart bars
  const maxDailyViews = useMemo(() => {
    if (!displayedDailyHistory.length) return 1;
    return Math.max(...displayedDailyHistory.map((d) => d.totalViews || 0), 100);
  }, [displayedDailyHistory]);

  // Filtered articles across sections
  const allArticles = useMemo(() => {
    if (!data?.sections) return [];
    const list: ArticleReadershipItem[] = [];
    data.sections.forEach((sec) => {
      sec.articles.forEach((art) => list.push(art));
    });
    return list;
  }, [data?.sections]);

  const displayedArticles = useMemo(() => {
    let result = allArticles;

    if (selectedSection !== "all") {
      result = result.filter(
        (a) => (a.category || "").trim().toLowerCase() === selectedSection.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          (a.category && a.category.toLowerCase().includes(q))
      );
    }

    const sorted = [...result];
    if (sortBy === "views-desc") {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "views-asc") {
      sorted.sort((a, b) => (a.views || 0) - (b.views || 0));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.publishedAt || b.date || 0).getTime() - new Date(a.publishedAt || a.date || 0).getTime());
    } else if (sortBy === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [allArticles, selectedSection, searchQuery, sortBy]);

  // Section categories list
  const categoriesList = useMemo(() => {
    if (!data?.sections) return [];
    return data.sections.map((s) => s.category);
  }, [data?.sections]);

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse p-6">
        <div className="h-8 w-72 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl my-6">
        <p className="text-red-700 font-semibold mb-3">Failed to load readership analytics</p>
        <p className="text-sm text-red-600 mb-6">{error || "Unknown error occurred"}</p>
        <button
          onClick={() => loadData(false)}
          className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-brand-accent transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { platform, sections, spotlights, topArticles } = data;

  return (
    <div className="space-y-10 pb-16">
      {/* Top Header & Refresh Control */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Activity size={13} className="animate-pulse" />
                Real-Time Verified Metrics
              </span>
              <span className="text-xs text-slate-400">100% Real Reader Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-editorial text-slate-900">
              Readership & Platform Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Track real-time reader counts across all publication sections, spotlight founder stories, and monitor everyday platform audience traffic.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
            {/* Range selector for chart */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 border border-slate-200">
              <button
                onClick={() => setDayRange(7)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dayRange === 7 ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDayRange(14)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dayRange === 14 ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                14 Days
              </button>
              <button
                onClick={() => setDayRange(30)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dayRange === 30 ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                30 Days
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs disabled:opacity-50"
              title="Refresh all metrics from database"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span>{refreshing ? "Refreshing..." : "Refresh Live"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BarChart3 size={15} />
            <span>Overview & Everyday Views</span>
          </button>

          <button
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "sections"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Layers size={15} />
            <span>Articles Readership by Section ({sections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("spotlights")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "spotlights"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Building2 size={15} />
            <span>Founder Spotlight Reads ({spotlights.totalSpotlights})</span>
          </button>

          <button
            onClick={() => setActiveTab("daily")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "daily"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar size={15} />
            <span>Daily History Breakdown</span>
          </button>
        </div>
      </div>

      {/* 4 CORE KPI STATS: Everyday Platform Traffic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Platform Views */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-brand-accent/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Platform Views</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Today</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-editorial text-slate-900">
              {platform.todayViews.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">views</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-emerald-600" />
              <strong>{platform.todayUniqueVisitors.toLocaleString()}</strong> unique
            </span>
            <span className="text-[11px] text-slate-400">
              vs Yesterday: {platform.yesterdayViews.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Yesterday's Platform Views */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Yesterday's Total Views</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Calendar size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-editorial text-slate-900">
              {platform.yesterdayViews.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">views</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>24h Full Day Traffic</span>
            <span className="font-semibold text-emerald-600">Complete record</span>
          </div>
        </div>

        {/* 7-Day Traffic & Daily Average */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">7-Day Total Traffic</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ArrowUpRight size={12} />
              +{platform.growthRate}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-editorial text-slate-900">
              {platform.last7DaysViews.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">views</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Daily avg:</span>
            <strong className="text-slate-800 font-semibold">{Math.round(platform.last7DaysViews / 7).toLocaleString()}/day</strong>
          </div>
        </div>

        {/* All-Time Platform Reach */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Platform Audience</span>
            <span className="p-2 bg-blue-50 text-brand-accent rounded-lg">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-editorial text-brand-accent">
              {platform.totalViews.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">reads</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Articles + Spotlights</span>
            <span className="font-semibold text-slate-700">{allArticles.length + spotlights.totalSpotlights} publications</span>
          </div>
        </div>
      </div>

      {/* VIEW: OVERVIEW (Daily Traffic Chart + Summary) */}
      {(activeTab === "overview" || activeTab === "daily") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-brand-accent" />
                <h2 className="text-xl font-bold font-editorial text-slate-900">
                  Everyday Platform Traffic ({dayRange} Days)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Total daily audience views, estimated unique readers, and distribution across articles vs spotlight stories
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-slate-900" /> Total Daily Views
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-brand-accent/70" /> Article Reads
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-amber-400" /> Spotlights
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="pt-8 pb-4">
            <div className="h-64 flex items-end gap-1.5 sm:gap-2.5 border-b border-slate-200 px-2">
              {displayedDailyHistory.map((item, idx) => {
                const heightPercent = item.totalViews > 0
                  ? Math.max(8, Math.round((item.totalViews / maxDailyViews) * 100))
                  : 0;
                const isToday = idx === displayedDailyHistory.length - 1;

                return (
                  <div
                    key={item.date || idx}
                    className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col bg-slate-950 text-white text-[11px] p-3 rounded-xl shadow-xl z-20 pointer-events-none min-w-[180px] border border-slate-800 -translate-x-1/2 left-1/2">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                        <span className="font-bold text-slate-200">{item.date}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Views:</span>
                          <strong className="text-white font-bold">{item.totalViews.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Unique Readers:</span>
                          <span className="text-emerald-400 font-medium">{item.uniqueVisitors.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Article Reads:</span>
                          <span className="text-slate-300 font-medium">{item.articleViews.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Spotlight Reads:</span>
                          <span className="text-amber-400 font-medium">{item.spotlightViews.toLocaleString()}</span>
                        </div>
                        {item.topCategory && (
                          <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                            <span className="text-slate-400">Top Section:</span>
                            <span className="text-blue-300">{item.topCategory}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bar visual */}
                    {heightPercent > 0 ? (
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${
                          isToday
                            ? "bg-brand-accent group-hover:bg-blue-600"
                            : "bg-slate-900 group-hover:bg-slate-800"
                        }`}
                      />
                    ) : (
                      <div className="w-full max-w-[28px] h-[3px] bg-slate-200 rounded-full group-hover:bg-slate-400 transition-colors" />
                    )}

                    {/* X-axis label */}
                    <span className="mt-2 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate w-full text-center">
                      {item.formattedDate || item.date?.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Table Breakdown if on 'daily' tab or expandable */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Day-by-Day Platform Traffic Log</span>
              <span className="text-xs font-normal text-slate-500">Showing last {displayedDailyHistory.length} recorded days</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Total Platform Views</th>
                    <th className="py-3 px-3">Unique Visitors</th>
                    <th className="py-3 px-3">Article Reads</th>
                    <th className="py-3 px-3">Spotlight Reads</th>
                    <th className="py-3 px-3">Leading Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[...displayedDailyHistory].reverse().map((d, i) => {
                    const isToday = i === 0;
                    return (
                      <tr key={d.date || i} className={isToday ? "bg-blue-50/40 font-medium" : "hover:bg-slate-50"}>
                        <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span>{d.date}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{d.totalViews.toLocaleString()}</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-slate-900 rounded-full"
                                style={{ width: `${Math.min(100, Math.round((d.totalViews / maxDailyViews) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">~{d.uniqueVisitors.toLocaleString()}</td>
                        <td className="py-3 px-3 text-brand-accent font-medium">{d.articleViews.toLocaleString()}</td>
                        <td className="py-3 px-3 text-amber-600 font-medium">{d.spotlightViews.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                            {d.topCategory || "FinTech"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SECTION-BY-SECTION READERSHIP (The exact number of people who read each article under each section) */}
      {(activeTab === "overview" || activeTab === "sections") && (
        <div className="space-y-8">
          {/* Section Summary Cards Grid */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <PieChartIcon size={18} className="text-brand-accent" />
                  <h2 className="text-xl font-bold font-editorial text-slate-900">
                    Publication Sections Breakdown
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Click any section below to filter and inspect the number of people who read each article in that category.
                </p>
              </div>

              {selectedSection !== "all" && (
                <button
                  onClick={() => setSelectedSection("all")}
                  className="text-xs text-brand-accent font-bold hover:underline"
                >
                  Clear Section Filter (Show All)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {sections.map((sec) => {
                const isSelected = selectedSection.toLowerCase() === sec.category.toLowerCase();
                return (
                  <button
                    key={sec.category}
                    onClick={() => setSelectedSection(isSelected ? "all" : sec.category)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <p className={`text-xs uppercase font-bold tracking-wider mb-1 truncate ${
                      isSelected ? "text-slate-300" : "text-slate-500"
                    }`}>
                      {sec.category}
                    </p>
                    <p className="text-xl font-bold font-editorial">
                      {sec.totalViews.toLocaleString()}
                    </p>
                    <p className={`text-[11px] mt-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                      {sec.totalArticles} {sec.totalArticles === 1 ? "story" : "stories"} • {sec.sharePercentage}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Articles Readership List with Search & Sort */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-editorial text-slate-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-accent" />
                  <span>Articles Readership Under {selectedSection === "all" ? "All Sections" : `"${selectedSection}"`}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-sans">
                    {displayedArticles.length} {displayedArticles.length === 1 ? "article" : "articles"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full list showing the exact number of readers for every published article
                </p>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search story or author..."
                    className="pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent w-48 sm:w-60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                >
                  <option value="views-desc">Sort: Most Read First</option>
                  <option value="views-asc">Sort: Least Read First</option>
                  <option value="newest">Sort: Newest Published</option>
                  <option value="title">Sort: Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Articles Table */}
            {displayedArticles.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <p className="text-sm font-semibold">No articles found matching your criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Try changing your section filter or search keywords.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3.5 px-3">Article & Title</th>
                      <th className="py-3.5 px-3">Section</th>
                      <th className="py-3.5 px-3">Author / Contributor</th>
                      <th className="py-3.5 px-3 text-right">Number of Readers</th>
                      <th className="py-3.5 px-3 text-right">Section Share</th>
                      <th className="py-3.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayedArticles.map((art) => {
                      const articleUrl = art.category && art.slug 
                        ? `/${art.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/${art.slug}`
                        : `/article/${art.id}`;

                      return (
                        <tr key={art.id} className="hover:bg-slate-50/80 transition-colors group">
                          {/* Title & Image */}
                          <td className="py-3.5 px-3 max-w-sm sm:max-w-md">
                            <div className="flex items-center gap-3">
                              {art.image && (
                                <img
                                  src={art.image}
                                  alt={art.title}
                                  className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 shadow-2xs"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <a
                                  href={articleUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-slate-900 hover:text-brand-accent transition-colors line-clamp-1 flex items-center gap-1"
                                >
                                  <span>{art.title}</span>
                                  <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-slate-400 shrink-0" />
                                </a>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {art.date || "Recently Published"} • {art.readTime || "4 min read"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Section */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {art.category}
                            </span>
                          </td>

                          {/* Author */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {art.authorImage ? (
                                <img
                                  src={art.authorImage}
                                  alt={art.author}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                  {art.author?.[0] || "A"}
                                </div>
                              )}
                              <span className="font-medium text-slate-800">{art.author}</span>
                            </div>
                          </td>

                          {/* Number of People Who Read This Article */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs">
                              <Users size={13} className="text-emerald-600" />
                              <span>{(art.views || 0).toLocaleString()} readers</span>
                            </div>
                          </td>

                          {/* Share of Section */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex flex-col items-end">
                              <span className="font-semibold text-slate-700">{art.shareOfCategory || 0}%</span>
                              <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-brand-accent rounded-full"
                                  style={{ width: `${Math.min(100, art.shareOfCategory || 0)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                              >
                                <span>Live</span>
                                <ExternalLink size={10} />
                              </a>
                              {onEditArticle && (
                                <button
                                  onClick={() => onEditArticle(art.id)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-black hover:bg-brand-accent rounded-lg transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: FOUNDER SPOTLIGHT READERSHIP */}
      {(activeTab === "overview" || activeTab === "spotlights") && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-brand-accent" />
                <h2 className="text-xl font-bold font-editorial text-slate-900">
                  Founder Spotlight Stories Readership
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Number of people who read each founder profile and startup case study
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600">
              <span>Total Spotlight Reads:</span>
              <strong className="text-slate-900 font-bold text-sm">
                {spotlights.totalViews.toLocaleString()}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {spotlights.items.map((spot) => {
              const spotUrl = spot.slug ? `/spotlight/${spot.slug}` : `/spotlight/${spot.id}`;

              return (
                <div
                  key={spot.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 hover:border-brand-accent/60 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <img
                        src={spot.image}
                        alt={spot.founderName}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                          {spot.companyName}
                        </span>
                        <h4 className="font-bold font-editorial text-base text-slate-900 group-hover:text-brand-accent transition-colors line-clamp-1">
                          {spot.founderName}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">
                          "{spot.title}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Reported by {spot.author || "Editorial"}</span>
                      <span className="text-xs text-slate-400">{spot.shareOfSpotlights}% share</span>
                    </div>
                  </div>

                  {/* Readership Metric Badge */}
                  <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                      <Users size={13} className="text-emerald-600" />
                      <span>{spot.views.toLocaleString()} readers</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={spotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>Live</span>
                        <ExternalLink size={10} />
                      </a>
                      {onEditSpotlight && (
                        <button
                          onClick={() => onEditSpotlight(spot.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-black hover:bg-brand-accent rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOP 5 LEADERBOARD */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
              <Award size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-editorial text-white">All-Time Top Read Publications</h3>
              <p className="text-xs text-slate-400">Highest engaging stories across the entire TechQuo network</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Platform Leaderboard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topArticles.slice(0, 6).map((art, idx) => (
            <div
              key={art.id || idx}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center font-bold font-editorial text-base text-amber-400 shrink-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{art.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {art.category} • by {art.author}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/80 shrink-0 ml-3">
                <Users size={12} />
                <span>{art.views.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
