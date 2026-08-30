import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../lib/AuthContext";
import { CATEGORIES } from "../constants";
import { createArticle, getArticles, deleteArticle } from "../services/articleService";
import { getEvents, createEvent, deleteEvent } from "../services/eventService";
import { getExperts, createExpert, deleteExpert } from "../services/expertService";
import { getSpotlightStories, createSpotlightStory, deleteSpotlightStory } from "../services/spotlightService";
import { Article, NewsEvent, Expert, SpotlightStory, DashboardTab } from "../types";
import { LayoutDashboard, FilePlus, LogOut, CheckCircle, AlertCircle, ArrowLeft, Upload, Image as ImageIcon, Loader2, Trash2, Calendar, Users, Twitter, Linkedin, ExternalLink, Sparkles, Database, RefreshCw, Server, Cloud, HardDrive, Key, Lock, Settings, Check, HelpCircle, ShieldAlert, FolderSync, ShieldCheck, UserCheck, Edit3, Edit, History, Tag, Eye } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { logout, hasAccessToTab, isSuperAdmin } from "../lib/auth";

import RichTextEditor from "../components/RichTextEditor";
import TeamManagement from "../components/TeamManagement";
import ChangePasswordModal from "../components/ChangePasswordModal";
import CreateContributorTab from "../components/CreateContributorTab";
import ManageContributorsTab from "../components/ManageContributorsTab";
import ContributorSelect from "../components/ContributorSelect";
import ArticleDatePicker from "../components/ArticleDatePicker";
import EditArticleModal from "../components/EditArticleModal";
import EditSpotlightModal from "../components/EditSpotlightModal";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [spotlights, setSpotlights] = useState<SpotlightStory[]>([]);
  const [editingSpotlight, setEditingSpotlight] = useState<SpotlightStory | null>(null);
  const [view, setView] = useState<DashboardTab>('create');
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Auto-switch to user's first permitted tab if current view is not accessible
  useEffect(() => {
    if (user) {
      if (!hasAccessToTab(user, view)) {
        const ALL_TABS: DashboardTab[] = [
          'create', 'manage', 'create-contributor', 'manage-contributors', 'create-event', 'manage-events',
          'create-expert', 'manage-experts', 'create-spotlight', 'manage-spotlight',
          'storage', 'team'
        ];
        const firstPermitted = ALL_TABS.find((t) => hasAccessToTab(user, t));
        if (firstPermitted) {
          setView(firstPermitted);
        }
      }
    }
  }, [user, view]);

  // Deep linking for editing article via query params: ?edit=article_id
  useEffect(() => {
    const editId = searchParams.get('edit') || searchParams.get('articleId');
    if (editId) {
      const match = articles.find(a => a.id === editId || (a as any)._id === editId || a.slug === editId);
      if (match) {
        setEditingArticle(match);
      } else {
        fetch(`/api/articles/${editId}`)
          .then(res => (res.ok ? res.json() : null))
          .then(data => {
            if (data && data.title) {
              setEditingArticle(data);
            }
          })
          .catch(() => {});
      }
    }
  }, [searchParams, articles]);
  
  // Storage settings state
  const [s3BucketInput, setS3BucketInput] = useState("");
  const [s3RegionInput, setS3RegionInput] = useState("us-east-1");
  const [s3AccessKeyInput, setS3AccessKeyInput] = useState("");
  const [s3SecretKeyInput, setS3SecretKeyInput] = useState("");
  const [s3Saving, setS3Saving] = useState(false);
  const [s3SaveMessage, setS3SaveMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [s3Testing, setS3Testing] = useState(false);
  const [s3TestResult, setS3TestResult] = useState<{
    success: boolean;
    message: string;
    bucket?: string;
    region?: string;
    url?: string;
    details?: string;
  } | null>(null);

  // Database & Storage status indicator state
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    type: string;
    dbName: string;
    host?: string;
    counts?: { articles: number; events: number; experts: number; spotlights: number };
    latencyMs?: number;
    timestamp?: string;
    storage?: {
      configured: boolean;
      connected: boolean;
      bucket: string;
      region: string;
      endpoint?: string;
      status: string;
    };
  } | null>(null);
  const [dbStatusLoading, setDbStatusLoading] = useState(false);

  const fetchDbStatus = async () => {
    setDbStatusLoading(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
        if (data.storage?.bucket && !s3BucketInput) {
          setS3BucketInput(data.storage.bucket);
        }
        if (data.storage?.region && s3RegionInput === "us-east-1") {
          setS3RegionInput(data.storage.region);
        }
      }
    } catch (err) {
      console.error("Failed to check db status:", err);
      setDbStatus({
        connected: false,
        type: "error",
        dbName: "disconnected",
        host: "unavailable",
      });
    } finally {
      setDbStatusLoading(false);
    }
  };

  const handleSaveS3Config = async (e: React.FormEvent) => {
    e.preventDefault();
    setS3Saving(true);
    setS3SaveMessage(null);
    try {
      const res = await fetch("/api/storage/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: s3BucketInput,
          region: s3RegionInput,
          accessKeyId: s3AccessKeyInput || undefined,
          secretAccessKey: s3SecretKeyInput || undefined,
        }),
      });

      if (res.ok) {
        setS3SaveMessage({ text: "S3 bucket configuration updated successfully.", success: true });
        fetchDbStatus();
      } else {
        const err = await res.json();
        setS3SaveMessage({ text: err.error || "Failed to update configuration.", success: false });
      }
    } catch (err: any) {
      setS3SaveMessage({ text: err.message || "Failed to save configuration.", success: false });
    } finally {
      setS3Saving(false);
    }
  };

  const handleTestS3Upload = async () => {
    setS3Testing(true);
    setS3TestResult(null);
    try {
      const res = await fetch("/api/storage/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: s3BucketInput || dbStatus?.storage?.bucket,
          region: s3RegionInput || dbStatus?.storage?.region,
        }),
      });
      const data = await res.json();
      setS3TestResult(data);
    } catch (err: any) {
      setS3TestResult({
        success: false,
        message: err.message || "Failed to contact diagnostic test endpoint.",
      });
    } finally {
      setS3Testing(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setSuccess(false);
    if (view === 'manage') {
      fetchArticles();
    } else if (view === 'manage-events') {
      fetchEvents();
    } else if (view === 'manage-experts') {
      fetchExperts();
    } else if (view === 'manage-spotlight') {
      fetchSpotlights();
    }
  }, [view]);

  const fetchArticles = async () => {
    const data = await getArticles();
    setArticles(data);
  };

  const fetchEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  const fetchExperts = async () => {
    const data = await getExperts();
    setExperts(data);
  };

  const fetchSpotlights = async () => {
    const data = await getSpotlightStories();
    setSpotlights(data);
  };

  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deletingEventIds, setDeletingEventIds] = useState<string[]>([]);
  const [deletingExpertIds, setDeletingExpertIds] = useState<string[]>([]);
  const [deletingSpotlightIds, setDeletingSpotlightIds] = useState<string[]>([]);

  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null);
  const [spotlightToDelete, setSpotlightToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => [...prev, id]);
    const success = await deleteArticle(id);
    if (success) {
      setArticles(prev => prev.filter(a => a.id !== id));
      setArticleToDelete(null);
    } else {
      setError("Failed to delete article. Check your permissions.");
    }
    setDeletingIds(prev => prev.filter(did => did !== id));
  };

  const handleEventDelete = async (id: string) => {
    setDeletingEventIds(prev => [...prev, id]);
    const success = await deleteEvent(id);
    if (success) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setEventToDelete(null);
    } else {
      setError("Failed to delete event. Check your permissions.");
    }
    setDeletingEventIds(prev => prev.filter(did => did !== id));
  };

  const handleExpertDelete = async (id: string) => {
    setDeletingExpertIds(prev => [...prev, id]);
    const success = await deleteExpert(id);
    if (success) {
      setExperts(prev => prev.filter(e => e.id !== id));
      setExpertToDelete(null);
    } else {
      setError("Failed to delete expert profile. Check your permissions.");
    }
    setDeletingExpertIds(prev => prev.filter(did => did !== id));
  };

  const handleSpotlightDelete = async (id: string) => {
    setDeletingSpotlightIds(prev => [...prev, id]);
    const success = await deleteSpotlightStory(id);
    if (success) {
      setSpotlights(prev => prev.filter(s => s.id !== id));
      setSpotlightToDelete(null);
    } else {
      setError("Failed to delete spotlight story. Check your permissions.");
    }
    setDeletingSpotlightIds(prev => prev.filter(did => did !== id));
  };

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: CATEGORIES[0].name,
    author: user?.displayName || "Admin",
    authorDesignation: "Contributor",
    contributorId: "",
    authorImage: "",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    publishedAt: new Date().toISOString(),
    readTime: "5 min",
    image: "",
    featured: false,
    content: ""
  });

  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    image: "",
    registrationLink: ""
  });

  const [expertFormData, setExpertFormData] = useState({
    name: "",
    title: "",
    bio: "",
    image: "",
    twitter: "",
    linkedin: "",
    website: "",
    contributionsCount: 0
  });

  const [spotlightFormData, setSpotlightFormData] = useState({
    founderName: "",
    companyName: "",
    title: "",
    story: "",
    image: "",
    link: "",
    author: user?.displayName || "TechQuo Editorial Staff",
    authorDesignation: "Contributor",
    contributorId: "",
    authorImage: "",
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 border border-slate-200 text-center shadow-sm">
          <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={24} className="text-white" />
          </div>
          <span className="font-editorial font-black text-2xl tracking-tighter uppercase mb-2 block">
            TechQuo News<span className="text-brand-accent">.</span>
          </span>
          <h1 className="text-xl font-editorial font-bold mb-2">Editorial Authentication Required</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Please log in with your administrative email and password to access the editorial console.
          </p>

          <div className="space-y-3">
            <Link
              to="/admin/login"
              className="w-full flex items-center justify-center gap-3 bg-black text-white px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors shadow-sm"
            >
              Go to Admin Login
            </Link>

            <Link 
              to="/" 
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-black font-bold uppercase tracking-widest text-xs py-2 transition-colors"
            >
              <ArrowLeft size={14} /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 border border-red-200 text-center shadow-sm">
          <AlertCircle size={44} className="text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-editorial font-bold mb-3">Account Suspended</h1>
          <p className="text-slate-500 text-sm mb-2">
            You are currently signed in as:
          </p>
          <p className="font-mono text-xs text-slate-700 font-bold bg-slate-100 py-1.5 px-3 rounded inline-block mb-4">
            {user.email}
          </p>
          <p className="text-slate-500 text-xs mb-8">
            Your editorial dashboard access has been suspended by an administrator. Please contact your Super Admin for reactivation.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={async () => {
                await logout();
                navigate("/admin/login");
              }}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
            >
              <LogOut size={14} /> Sign Out & Switch Account
            </button>
            <Link to="/" className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-black font-bold uppercase tracking-widest text-xs py-2 transition-colors">
              <ArrowLeft size={14} /> Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
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
    console.log("Starting upload for file:", file.name, "Size:", file.size);
    setUploadProgress(20);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadProgress(50);
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64Data, name: file.name, folder: "editorial" }),
          });
          setUploadProgress(85);
          if (res.ok) {
            const data = await res.json();
            setUploadProgress(100);
            resolve(data.url || base64Data);
          } else {
            // Fallback to Base64 payload
            setUploadProgress(100);
            resolve(base64Data);
          }
        } catch (err) {
          console.warn("Backend S3 upload encountered error, fallback to data url:", err);
          setUploadProgress(100);
          resolve(base64Data);
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      let imageUrl = formData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        throw new Error("Please provide an image for the article.");
      }

      await createArticle({
        ...formData,
        image: imageUrl,
        authorId: user.uid,
        postedBy: user.uid,
        postedByName: user.displayName || user.email || 'Editorial Staff'
      } as any);
      setSuccess(true);
      setFormData({
        ...formData,
        title: "",
        excerpt: "",
        authorDesignation: "Contributor",
        image: "",
        content: "",
        featured: false,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        publishedAt: new Date().toISOString(),
      });
      setImageFile(null);
      setImagePreview(null);
      fetchArticles();
    } catch (err: any) {
      setError(err.message || "Failed to create article");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = eventFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800"; // Default
      }

      await createEvent({
        ...eventFormData,
        image: imageUrl
      });
      setSuccess(true);
      setEventFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        time: "",
        image: "",
        registrationLink: ""
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleExpertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = expertFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800"; // Default avatar
      }

      await createExpert({
        ...expertFormData,
        image: imageUrl
      });
      setSuccess(true);
      setExpertFormData({
        name: "",
        title: "",
        bio: "",
        image: "",
        twitter: "",
        linkedin: "",
        website: "",
        contributionsCount: 0
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      setError(err.message || "Failed to add expert");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSpotlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = spotlightFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"; // Default tech/office
      }

      await createSpotlightStory({
        ...spotlightFormData,
        image: imageUrl,
        author: spotlightFormData.author.trim() || user.displayName || 'TechQuo Editorial Staff',
        authorDesignation: spotlightFormData.authorDesignation.trim() || 'Contributor',
        contributorId: spotlightFormData.contributorId || undefined,
        authorImage: spotlightFormData.authorImage || undefined,
        postedBy: user.uid,
        postedByName: user.displayName || user.email || 'Editorial Staff'
      });
      setSuccess(true);
      setSpotlightFormData({
        founderName: "",
        companyName: "",
        title: "",
        story: "",
        image: "",
        link: "",
        author: user.displayName || "TechQuo Editorial Staff",
        authorDesignation: "Contributor",
        contributorId: "",
        authorImage: "",
      });
      setImageFile(null);
      setImagePreview(null);
      fetchSpotlights();
    } catch (err: any) {
      setError(err.message || "Failed to create spotlight story");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-8 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-1 mb-12">
          <span className="font-editorial font-black text-2xl tracking-tighter uppercase">TechQuo News<span className="text-brand-accent">.</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {hasAccessToTab(user, 'create') && (
            <button 
              onClick={() => setView('create')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <FilePlus size={18} />
              Publish
            </button>
          )}

          {hasAccessToTab(user, 'manage') && (
            <button 
              onClick={() => setView('manage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <LayoutDashboard size={18} />
              Manage feed
            </button>
          )}

          {(hasAccessToTab(user, 'create-contributor') || hasAccessToTab(user, 'manage-contributors')) && (
            <div className="pt-4 pb-2 px-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contributors & Authors</p>
            </div>
          )}

          {hasAccessToTab(user, 'create-contributor') && (
            <button 
              onClick={() => setView('create-contributor')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-contributor' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <UserCheck size={18} />
              Add Contributor
            </button>
          )}

          {hasAccessToTab(user, 'manage-contributors') && (
            <button 
              onClick={() => setView('manage-contributors')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-contributors' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Users size={18} />
              Manage Authors
            </button>
          )}
          
          {(hasAccessToTab(user, 'create-event') || hasAccessToTab(user, 'manage-events')) && (
            <div className="pt-4 pb-2 px-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Events Management</p>
            </div>
          )}

          {hasAccessToTab(user, 'create-event') && (
            <button 
              onClick={() => setView('create-event')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-event' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Calendar size={18} />
              Post Event
            </button>
          )}

          {hasAccessToTab(user, 'manage-events') && (
            <button 
              onClick={() => setView('manage-events')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-events' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <LayoutDashboard size={18} />
              Manage events
            </button>
          )}

          {(hasAccessToTab(user, 'create-expert') || hasAccessToTab(user, 'manage-experts')) && (
            <div className="pt-4 pb-2 px-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Experts Network</p>
            </div>
          )}

          {hasAccessToTab(user, 'create-expert') && (
            <button 
              onClick={() => setView('create-expert')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-expert' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Users size={18} />
              Add Expert
            </button>
          )}

          {hasAccessToTab(user, 'manage-experts') && (
            <button 
              onClick={() => setView('manage-experts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-experts' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <LayoutDashboard size={18} />
              Manage Experts
            </button>
          )}

          {(hasAccessToTab(user, 'create-spotlight') || hasAccessToTab(user, 'manage-spotlight')) && (
            <div className="pt-4 pb-2 px-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Spotlight Stories</p>
            </div>
          )}

          {hasAccessToTab(user, 'create-spotlight') && (
            <button 
              onClick={() => setView('create-spotlight')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-spotlight' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Sparkles size={18} />
              Add Spotlight
            </button>
          )}

          {hasAccessToTab(user, 'manage-spotlight') && (
            <button 
              onClick={() => setView('manage-spotlight')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-spotlight' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <LayoutDashboard size={18} />
              Manage Spotlight
            </button>
          )}

          {(hasAccessToTab(user, 'storage') || hasAccessToTab(user, 'team')) && (
            <div className="pt-4 pb-2 px-4">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Administration & System</p>
            </div>
          )}

          {hasAccessToTab(user, 'storage') && (
            <button 
              onClick={() => setView('storage')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'storage' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Cloud size={18} />
              S3 & Storage
            </button>
          )}

          {hasAccessToTab(user, 'team') && (
            <button 
              onClick={() => setView('team')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'team' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <ShieldCheck size={18} />
              Team & Roles
            </button>
          )}
        </nav>

        {/* Infrastructure Status Indicator Panel in Sidebar */}
        <div 
          onClick={() => setView('storage')}
          className="mt-auto mb-4 p-3 bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-white/10 transition-colors"
          title="Click to manage S3 Storage & Connections"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database size={14} className={dbStatus?.connected ? "text-emerald-400" : "text-amber-400"} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                {dbStatus?.connected ? "MongoDB Connected" : "DB Storage"}
              </span>
            </div>
            <button 
              onClick={fetchDbStatus}
              title="Test & refresh connections"
              disabled={dbStatusLoading}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 p-1"
            >
              <RefreshCw size={12} className={dbStatusLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-[11px] text-slate-300 font-mono font-medium truncate">
              {dbStatus?.connected ? dbStatus.dbName : (dbStatus?.dbName || "Connecting...")}
            </span>
            {dbStatus?.latencyMs !== undefined && (
              <span className="text-[9px] text-slate-400 font-mono ml-auto">
                {dbStatus.latencyMs}ms
              </span>
            )}
          </div>

          {dbStatus?.host && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono truncate mb-2">
              <Server size={10} className="shrink-0 text-slate-500" />
              <span className="truncate">{dbStatus.host}</span>
            </div>
          )}

          {/* S3 Storage Account Status */}
          <div className="mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <Cloud size={12} className={dbStatus?.storage?.connected ? "text-cyan-400" : (dbStatus?.storage?.configured ? "text-amber-400" : "text-slate-400")} />
                <span>S3 Storage</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                dbStatus?.storage?.connected 
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                  : (dbStatus?.storage?.configured ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-700/50 text-slate-400")
              }`}>
                {dbStatus?.storage?.connected ? "ACTIVE" : (dbStatus?.storage?.configured ? "READY" : "FALLBACK")}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 font-mono truncate">
              Bucket: <strong className="text-slate-200">{dbStatus?.storage?.bucket || "techquo-news-assets"}</strong>
            </div>
          </div>

          {dbStatus?.counts && (
            <div className="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-1 text-[9px] text-slate-400">
              <span>Articles: <strong className="text-slate-200">{dbStatus.counts.articles}</strong></span>
              <span>Events: <strong className="text-slate-200">{dbStatus.counts.events}</strong></span>
              <span>Experts: <strong className="text-slate-200">{dbStatus.counts.experts}</strong></span>
              <span>Spotlights: <strong className="text-slate-200">{dbStatus.counts.spotlights}</strong></span>
            </div>
          )}
        </div>

        <Link to="/" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded text-sm font-bold uppercase tracking-wider text-slate-400 transition-colors">
          <ArrowLeft size={18} />
          Site Home
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-4xl font-editorial font-bold">Editorial Management Hub</h1>
              
              {/* User Role Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-brand-accent border border-slate-800">
                <ShieldCheck size={12} className="text-brand-accent" />
                <span>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'editor' ? 'Editor' : user?.role === 'event_manager' ? 'Events Manager' : user?.role || 'Staff'}</span>
              </div>

              {/* Database Indicator Pill */}
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                dbStatus?.connected 
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span>{dbStatus?.connected ? `MongoDB: ${dbStatus.dbName}` : "DB: Active (Local fallback)"}</span>
                {dbStatus?.latencyMs !== undefined && (
                  <span className="text-[10px] text-slate-400 font-normal">({dbStatus.latencyMs}ms)</span>
                )}
                <button 
                  onClick={fetchDbStatus} 
                  title="Check database & storage connection"
                  disabled={dbStatusLoading}
                  className="hover:opacity-75 transition-opacity"
                >
                  <RefreshCw size={10} className={dbStatusLoading ? "animate-spin" : ""} />
                </button>
              </div>

              {/* AWS S3 Storage Indicator Pill */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                dbStatus?.storage?.connected 
                  ? "bg-cyan-50 text-cyan-800 border-cyan-200" 
                  : (dbStatus?.storage?.configured ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200")
              }`}>
                <Cloud size={12} className={dbStatus?.storage?.connected ? "text-cyan-600" : "text-slate-500"} />
                <span>
                  S3: {dbStatus?.storage?.bucket && dbStatus.storage.bucket !== "Not configured" ? dbStatus.storage.bucket : "Storage Ready"}
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              Welcome back, <strong className="text-slate-800">{user?.displayName || user?.email}</strong>. 
              {view === 'create' ? ' Create a new story.' : 
               view === 'manage' ? ' Manage your feed.' : 
               view === 'create-contributor' ? ' Register a new contributing writer or analyst.' :
               view === 'manage-contributors' ? ' Manage contributor directory, slugs, and profiles.' :
               view === 'create-event' ? ' Post an upcoming event.' : 
               view === 'manage-events' ? ' Manage scheduled events.' :
               view === 'create-expert' ? ' Add a new expert to the network.' :
               view === 'manage-experts' ? ' Edit expert profiles.' :
               view === 'create-spotlight' ? ' Feature a new founder story.' :
               view === 'manage-spotlight' ? ' Edit spotlights.' :
               view === 'storage' ? ' Configure database and media storage.' :
               view === 'team' ? ' Manage team members, custom roles, and tab permissions.' :
               ' Editorial dashboard.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setChangePasswordModalOpen(true)}
              className="px-3.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
              title="Update your password and security credentials"
            >
              <Key size={13} className="text-slate-500" />
              <span>Password</span>
            </button>
            <button 
              onClick={async () => {
                await logout();
                navigate("/admin/login");
              }}
              className="editorial-label text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-100"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Horizontal Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto pb-3 mb-8 gap-2 border-b border-slate-200 no-scrollbar">
          {hasAccessToTab(user, 'create') && (
            <button onClick={() => setView('create')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'create' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Publish
            </button>
          )}
          {hasAccessToTab(user, 'manage') && (
            <button onClick={() => setView('manage')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'manage' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Feed
            </button>
          )}
          {hasAccessToTab(user, 'create-contributor') && (
            <button onClick={() => setView('create-contributor')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'create-contributor' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              + Contributor
            </button>
          )}
          {hasAccessToTab(user, 'manage-contributors') && (
            <button onClick={() => setView('manage-contributors')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'manage-contributors' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Contributors
            </button>
          )}
          {hasAccessToTab(user, 'create-event') && (
            <button onClick={() => setView('create-event')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'create-event' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Post Event
            </button>
          )}
          {hasAccessToTab(user, 'manage-events') && (
            <button onClick={() => setView('manage-events')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'manage-events' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Events
            </button>
          )}
          {hasAccessToTab(user, 'create-expert') && (
            <button onClick={() => setView('create-expert')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'create-expert' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Add Expert
            </button>
          )}
          {hasAccessToTab(user, 'manage-experts') && (
            <button onClick={() => setView('manage-experts')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'manage-experts' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Experts
            </button>
          )}
          {hasAccessToTab(user, 'create-spotlight') && (
            <button onClick={() => setView('create-spotlight')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'create-spotlight' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Add Spotlight
            </button>
          )}
          {hasAccessToTab(user, 'manage-spotlight') && (
            <button onClick={() => setView('manage-spotlight')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'manage-spotlight' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Spotlights
            </button>
          )}
          {hasAccessToTab(user, 'storage') && (
            <button onClick={() => setView('storage')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'storage' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Storage
            </button>
          )}
          {hasAccessToTab(user, 'team') && (
            <button onClick={() => setView('team')} className={`px-4 py-2 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors ${view === 'team' ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
              Team & Roles
            </button>
          )}
        </div>

        {view === 'create' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Publish New Article
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Article successfully published to the live feed.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Article Headline</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="Enter a compelling title..."
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Topic / Category</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent uppercase text-xs font-bold tracking-widest"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Contributor Database Selector */}
                <div className="p-4 bg-slate-100/60 border border-slate-200 rounded">
                  <ContributorSelect
                    selectedContributorId={formData.contributorId}
                    authorName={formData.author}
                    onSelect={(c) => {
                      if (c) {
                        setFormData({
                          ...formData,
                          contributorId: c.id || c._id || "",
                          author: c.name,
                          authorDesignation: c.title || "Contributor",
                          authorImage: c.profileImage || c.avatar || "",
                        });
                      } else {
                        setFormData({
                          ...formData,
                          contributorId: "",
                        });
                      }
                    }}
                    onNavigateCreateContributor={() => setView('create-contributor')}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Author Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. John Doe"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Author Title / Designation</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. Senior Strategy Analyst"
                      value={formData.authorDesignation}
                      onChange={e => setFormData({...formData, authorDesignation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Brief Excerpt (Subheadline)</label>
                  <textarea 
                    required
                    rows={2}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-slate-600 leading-relaxed"
                    placeholder="Summary for the preview cards..."
                    value={formData.excerpt}
                    onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  />
                </div>

                {/* Article Publication Date & Backdating */}
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

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Featured Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden rounded-md"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-slate-300 mb-2" size={32} />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Click to upload story visual</p>
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
                    {imageFile && !imagePreview && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">File selected: {imageFile.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Estimated Read Time</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. 5 min"
                      value={formData.readTime}
                      onChange={e => setFormData({...formData, readTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 w-fit">
                  <input 
                    type="checkbox" 
                    id="featured" 
                    className="w-4 h-4 text-brand-accent rounded border-slate-300"
                    checked={formData.featured}
                    onChange={e => setFormData({...formData, featured: e.target.checked})}
                  />
                  <label htmlFor="featured" className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                    Feature on Hero Section
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Full Article Content (Rich Text)</label>
                  <RichTextEditor 
                    content={formData.content} 
                    onChange={(content) => setFormData({...formData, content})} 
                    placeholder="Write your story here... Use the toolbar for formatting."
                  />
                </div>

                <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Preparing Visuals ({Math.round(uploadProgress)}%)...
                    </>
                  ) : loading ? (
                    "Publishing Dispatch..."
                  ) : (
                    "Release Story for Circulation"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-event' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Post New Event
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Event successfully posted to the network.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleEventSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="editorial-label">Event Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                    placeholder="e.g. Fintech Lagos 2026"
                    value={eventFormData.title}
                    onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      value={eventFormData.date}
                      onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Time</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. 10:00 AM - 4:00 PM"
                      value={eventFormData.time}
                      onChange={e => setEventFormData({...eventFormData, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Location</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. Landmark Centre, VI, Lagos"
                    value={eventFormData.location}
                    onChange={e => setEventFormData({...eventFormData, location: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Registration Link (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. https://eventbrite.com/..."
                    value={eventFormData.registrationLink}
                    onChange={e => setEventFormData({...eventFormData, registrationLink: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Event Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Event Graphic</p>
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
                  {imageFile && !imagePreview && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">File selected: {imageFile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Event Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent"
                    placeholder="Tell us more about the event..."
                    value={eventFormData.description}
                    onChange={e => setEventFormData({...eventFormData, description: e.target.value})}
                  />
                </div>

                <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading Asset...
                    </>
                  ) : loading ? (
                    "Staging Event..."
                  ) : (
                    "Publish Event"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-expert' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Add Industry Expert
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Expert profile successfully created.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleExpertSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Expert Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="e.g. Dr. Jane Smith"
                      value={expertFormData.name}
                      onChange={e => setExpertFormData({...expertFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Professional Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. CEO, FinTech Innovations"
                      value={expertFormData.title}
                      onChange={e => setExpertFormData({...expertFormData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <Twitter size={14} /> Twitter (X)
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="@username"
                      value={expertFormData.twitter}
                      onChange={e => setExpertFormData({...expertFormData, twitter: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <Linkedin size={14} /> LinkedIn
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="linkedin.com/in/..."
                      value={expertFormData.linkedin}
                      onChange={e => setExpertFormData({...expertFormData, linkedin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <ExternalLink size={14} /> Website
                    </label>
                    <input 
                      type="url" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="https://..."
                      value={expertFormData.website}
                      onChange={e => setExpertFormData({...expertFormData, website: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Expert Headshot</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-1" size={24} />
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
                  <p className="text-[10px] text-slate-400 mt-2">Recommended: Square aspect ratio, transparent or clean background.</p>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Biography & Expertise</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent"
                    placeholder="Short bio and notable contributions..."
                    value={expertFormData.bio}
                    onChange={e => setExpertFormData({...expertFormData, bio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Article Contributions Count</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    value={expertFormData.contributionsCount}
                    onChange={e => setExpertFormData({...expertFormData, contributionsCount: parseInt(e.target.value) || 0})}
                  />
                </div>

                <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Storing Image...
                    </>
                  ) : loading ? (
                    "Adding Expert..."
                  ) : (
                    "Confirm Expert Profile"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-spotlight' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Feature Founder Story
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Spotlight story successfully created.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSpotlightSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Founder Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="e.g. Aliko Dangote"
                      value={spotlightFormData.founderName}
                      onChange={e => setSpotlightFormData({...spotlightFormData, founderName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Company Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. Dangote Group"
                      value={spotlightFormData.companyName}
                      onChange={e => setSpotlightFormData({...spotlightFormData, companyName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Spotlight Title (Headline)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. Redefining Industrialization in Africa"
                    value={spotlightFormData.title}
                    onChange={e => setSpotlightFormData({...spotlightFormData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Feature Link (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="https://..."
                    value={spotlightFormData.link}
                    onChange={e => setSpotlightFormData({...spotlightFormData, link: e.target.value})}
                  />
                </div>

                {/* Author / Byline & Contributor Selection */}
                <div className="bg-slate-50 p-6 border border-slate-200 rounded-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <UserCheck size={16} className="text-brand-accent" />
                    Story Author / Byline Attribution
                  </h4>

                  <ContributorSelect
                    selectedContributorId={spotlightFormData.contributorId}
                    authorName={spotlightFormData.author}
                    onSelect={(c) => {
                      if (c) {
                        setSpotlightFormData({
                          ...spotlightFormData,
                          author: c.name,
                          authorDesignation: c.title || 'Contributing Writer',
                          contributorId: c.id || c._id || '',
                          authorImage: c.profileImage || c.avatar || '',
                        });
                      } else {
                        setSpotlightFormData({
                          ...spotlightFormData,
                          contributorId: '',
                        });
                      }
                    }}
                    onNavigateCreateContributor={() => setView('create-contributor')}
                  />

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Author Name
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-slate-300 rounded-sm outline-hidden focus:border-black text-sm"
                        placeholder="e.g. Subair Nurudeen"
                        value={spotlightFormData.author}
                        onChange={(e) => setSpotlightFormData({ ...spotlightFormData, author: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Author Designation
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 bg-white border border-slate-300 rounded-sm outline-hidden focus:border-black text-sm"
                        placeholder="e.g. Senior Tech Journalist"
                        value={spotlightFormData.authorDesignation}
                        onChange={(e) => setSpotlightFormData({ ...spotlightFormData, authorDesignation: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Spotlight Visual</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Spotlight Image</p>
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

                <div className="space-y-2">
                  <label className="editorial-label flex items-center justify-between">
                    <span>Founder's Narrative Story (Rich Text)</span>
                    <span className="text-[10px] text-slate-500 font-normal uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} className="text-brand-accent" />
                      Full Rich Text Formatting
                    </span>
                  </label>
                  <RichTextEditor 
                    content={spotlightFormData.story} 
                    onChange={story => setSpotlightFormData({...spotlightFormData, story})} 
                    placeholder="The narrative of their journey... Format with bold, italics, quotes, lists, headings, and links."
                  />
                </div>

                <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading Asset...
                    </>
                  ) : loading ? (
                    "Publishing Spotlight..."
                  ) : (
                    "Confirm Spotlight Feature"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'manage-spotlight' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Founder Spotlights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {spotlights.map(story => (
                  <div key={story.id} className="border border-slate-100 hover:border-brand-accent/30 transition-all flex flex-col relative group bg-white">
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingSpotlight(story)}
                        title="Edit Founder Spotlight"
                        className="bg-white/90 backdrop-blur-xs p-2 rounded-full text-slate-600 hover:text-black hover:bg-slate-100 shadow-sm transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        onClick={() => setSpotlightToDelete(story.id)}
                        title="Delete Spotlight"
                        className="bg-white/90 backdrop-blur-xs p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 shadow-sm transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    
                    <div className="h-40 overflow-hidden">
                      <img src={story.image} alt={story.founderName} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2">{story.companyName}</p>
                      <h3 className="font-editorial font-bold text-xl mb-3 text-slate-900">{story.founderName}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {story.story ? story.story.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : ''}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium text-slate-700">
                          By: {story.author || 'Editorial Staff'}
                        </span>
                        {story.postedByName && (
                          <span className="text-slate-400">
                            Posted by: {story.postedByName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {spotlights.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-serif italic">No spotlights featured yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : view === 'manage-experts' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Expert Network
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experts.map(expert => (
                  <div key={expert.id} className="p-6 border border-slate-100 hover:border-brand-accent/30 transition-all flex flex-col items-center text-center relative group">
                    <button 
                      onClick={() => setExpertToDelete(expert.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 mb-4">
                      <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <h3 className="font-serif font-bold text-slate-900">{expert.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{expert.title}</p>
                    
                    <div className="flex gap-4 mb-4">
                      {expert.twitter && <Twitter size={14} className="text-slate-400" />}
                      {expert.linkedin && <Linkedin size={14} className="text-slate-400" />}
                    </div>

                    <div className="pt-4 border-t border-slate-50 w-full">
                       <p className="text-[10px] font-bold text-brand-accent">{expert.contributionsCount || 0} CONTRIBUTIONS</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {experts.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-serif italic">No experts registered in the network.</p>
                </div>
              )}
            </div>
          </section>
        ) : view === 'manage-events' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Scheduled Events
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 italic-editorial text-xs text-slate-400">
                      <th className="pb-4 font-normal">Event Title</th>
                      <th className="pb-4 font-normal">Date</th>
                      <th className="pb-4 font-normal">Location</th>
                      <th className="pb-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {events.map(event => (
                      <tr key={event.id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="py-6 pr-6">
                          <span className="font-serif font-bold text-slate-900 line-clamp-1">{event.title}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-xs text-slate-500 font-mono tracking-tight">{event.date}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-xs text-slate-500">{event.location}</span>
                        </td>
                        <td className="py-6 text-right">
                          <button 
                            disabled={deletingEventIds.includes(event.id)}
                            onClick={() => setEventToDelete(event.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete Event"
                          >
                            {deletingEventIds.includes(event.id) ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-serif italic">No events scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : view === 'storage' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-editorial font-bold flex items-center gap-3 text-black">
                    <Cloud className="text-brand-accent" size={24} />
                    Amazon S3 & Media Storage Configuration
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Manage your S3 bucket connection for editorial asset uploads and inspect storage health.
                  </p>
                </div>
                <button
                  onClick={fetchDbStatus}
                  disabled={dbStatusLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={dbStatusLoading ? "animate-spin" : ""} />
                  Refresh Status
                </button>
              </div>

              {/* Status Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Active Bucket</p>
                  <p className="font-mono text-sm font-bold text-slate-900 truncate">
                    {dbStatus?.storage?.bucket || "techquo-news-bucket"}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono">AWS Region: {dbStatus?.storage?.region || "us-east-1"}</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Storage Pipeline</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.storage?.connected ? "bg-cyan-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className="text-xs font-bold text-slate-800">
                      {dbStatus?.storage?.connected ? "AWS S3 Direct" : "Hybrid S3 / MongoDB"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Zero broken image guarantee</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">IAM Credentials</p>
                  <div className="flex items-center gap-1.5">
                    <Key size={13} className="text-slate-500" />
                    <span className="text-xs font-mono font-medium text-slate-800">
                      {dbStatus?.storage?.configured ? "Key Configured" : "Missing AWS Keys"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Environment secret status</span>
                </div>
              </div>

              {/* Why are images in MongoDB vs S3 notice */}
              <div className="mb-8 p-4 bg-amber-50/60 border border-amber-200/80 rounded flex items-start gap-3">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="font-bold">How S3 Bucket Destination Works:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-amber-800">
                    <li>AWS S3 requires the exact bucket name (e.g. your newly created bucket name).</li>
                    <li>AWS S3 also requires valid AWS IAM credentials (<code>AWS_ACCESS_KEY_ID</code> and <code>AWS_SECRET_ACCESS_KEY</code>) with <code>s3:PutObject</code> permissions to write directly into your bucket.</li>
                    <li>When keys are not provided or if AWS returns <em>Access Denied (403)</em>, the backend automatically safeguards your publish flow by storing the image directly in MongoDB so your articles publish without error.</li>
                  </ul>
                </div>
              </div>

              {/* S3 Settings Form */}
              <form onSubmit={handleSaveS3Config} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Target S3 Bucket Name
                    </label>
                    <input
                      type="text"
                      value={s3BucketInput}
                      onChange={(e) => setS3BucketInput(e.target.value)}
                      placeholder="e.g. techquo-news or techquo-news-bucket"
                      className="w-full p-3 border border-slate-200 font-mono text-sm focus:outline-none focus:border-black rounded-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Enter the exact name of your newly created Amazon S3 bucket.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      AWS Region
                    </label>
                    <input
                      type="text"
                      value={s3RegionInput}
                      onChange={(e) => setS3RegionInput(e.target.value)}
                      placeholder="e.g. us-east-1, eu-west-1, af-south-1"
                      className="w-full p-3 border border-slate-200 font-mono text-sm focus:outline-none focus:border-black rounded-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      The AWS region where your bucket resides (e.g., <code>us-east-1</code>, <code>af-south-1</code>).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      AWS Access Key ID (Optional if set in Env)
                    </label>
                    <input
                      type="text"
                      value={s3AccessKeyInput}
                      onChange={(e) => setS3AccessKeyInput(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full p-3 border border-slate-200 font-mono text-sm focus:outline-none focus:border-black rounded-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      AWS Secret Access Key (Optional if set in Env)
                    </label>
                    <input
                      type="password"
                      value={s3SecretKeyInput}
                      onChange={(e) => setS3SecretKeyInput(e.target.value)}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      className="w-full p-3 border border-slate-200 font-mono text-sm focus:outline-none focus:border-black rounded-none"
                    />
                  </div>
                </div>

                {s3SaveMessage && (
                  <div className={`p-4 text-xs font-medium ${s3SaveMessage.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                    {s3SaveMessage.text}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={s3Saving}
                    className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {s3Saving ? "Saving Configuration..." : "Save Bucket Settings"}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestS3Upload}
                    disabled={s3Testing}
                    className="px-6 py-3 border border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {s3Testing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Running S3 Diagnostic Test...
                      </>
                    ) : (
                      <>
                        <FolderSync size={14} />
                        Test S3 Connection & Upload
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Diagnostic Test Result Box */}
              {s3TestResult && (
                <div className={`mt-6 p-5 border ${s3TestResult.success ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {s3TestResult.success ? (
                      <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    )}
                    <h3 className={`text-sm font-bold ${s3TestResult.success ? "text-emerald-900" : "text-amber-900"}`}>
                      {s3TestResult.success ? "S3 Connection & Upload Verified!" : "S3 Upload Test Diagnostics"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-700 mb-2 leading-relaxed">{s3TestResult.message}</p>
                  {s3TestResult.details && (
                    <p className="text-[11px] font-mono text-slate-600 bg-white/60 p-2 rounded border border-slate-200 mb-2">
                      {s3TestResult.details}
                    </p>
                  )}
                  {s3TestResult.url && (
                    <div className="text-[11px] font-mono text-emerald-800 break-all">
                      Uploaded Test File: <a href={s3TestResult.url} target="_blank" rel="noopener noreferrer" className="underline font-bold">{s3TestResult.url}</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AWS S3 Setup Quick Reference */}
            <div className="bg-white border border-slate-200 p-8">
              <h3 className="text-lg font-editorial font-bold mb-4 flex items-center gap-2">
                <HelpCircle size={18} className="text-slate-400" />
                AWS S3 Recommended Settings for TechQuo News
              </h3>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-4 bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-1">1. S3 Bucket CORS Configuration (JSON)</h4>
                  <p className="mb-2 text-slate-500">To allow editorial previewing and web delivery without browser restrictions, set this under AWS S3 &gt; Permissions &gt; CORS:</p>
                  <pre className="p-3 bg-black text-slate-200 text-[11px] font-mono overflow-x-auto rounded">
{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`}
                  </pre>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100">
                  <h4 className="font-bold text-slate-900 mb-1">2. S3 Bucket Public Read Policy (Optional for public media)</h4>
                  <p className="mb-2 text-slate-500">Under Permissions &gt; Bucket policy (replace <code>YOUR_BUCKET_NAME</code> with your bucket name):</p>
                  <pre className="p-3 bg-black text-slate-200 text-[11px] font-mono overflow-x-auto rounded">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        ) : view === 'team' ? (
          <TeamManagement />
        ) : view === 'manage' ? (
          <section className="max-w-5xl">
             <div className="bg-white border border-slate-200 p-8 md:p-12">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                 <div>
                   <h2 className="text-2xl font-editorial font-bold flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                    Manage Circulation
                   </h2>
                   <p className="text-slate-500 text-sm mt-1">
                     Review, update published stories, modify bylines, backdate publication dates, or cease circulation.
                   </p>
                 </div>
                 <button
                   onClick={fetchArticles}
                   className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors"
                 >
                   <RefreshCw size={13} />
                   Refresh Feed
                 </button>
               </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 italic-editorial text-xs text-slate-400">
                      <th className="pb-4 font-normal">Story Headline</th>
                      <th className="pb-4 font-normal">Category</th>
                      <th className="pb-4 font-normal">Date Published</th>
                      <th className="pb-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {articles.map(article => {
                      const categorySlug = (article.category || 'technology').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                      const articleSlug = article.slug || article.id;
                      const liveUrl = `/${categorySlug}/${articleSlug}`;
                      const isBackdated = article.publishedAt && new Date(article.publishedAt) < new Date(new Date().toDateString());

                      return (
                        <tr key={article.id} className="group transition-colors hover:bg-slate-50/70">
                          <td className="py-5 pr-6">
                            <div className="flex items-center gap-3">
                              {article.image && (
                                <img
                                  src={article.image}
                                  alt={article.title}
                                  className="w-12 h-10 object-cover rounded shrink-0 border border-slate-200 hidden sm:block"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <div className="min-w-0">
                                <button
                                  onClick={() => setEditingArticle(article)}
                                  className="text-left font-serif font-bold text-slate-900 line-clamp-1 hover:text-brand-accent transition-colors block"
                                  title="Click to edit story"
                                >
                                  {article.title}
                                </button>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  by <strong className="text-slate-600">{article.author || 'Staff'}</strong>
                                  {article.featured && <span className="ml-2 text-brand-accent font-bold">★ Hero Featured</span>}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5">
                             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                               {article.category}
                             </span>
                          </td>
                          <td className="py-5">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-700 font-mono tracking-tight flex items-center gap-1">
                                <Calendar size={12} className="text-slate-400" />
                                {article.date}
                              </span>
                              {isBackdated && (
                                <span className="text-[9px] text-amber-700 font-mono flex items-center gap-0.5 mt-0.5">
                                  <History size={10} /> Backdated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit Published Article Button */}
                              <button 
                                onClick={() => setEditingArticle(article)}
                                className="p-2 text-slate-600 hover:text-brand-accent hover:bg-slate-100 transition-all rounded"
                                title="Edit Published Story"
                              >
                                <Edit3 size={17} />
                              </button>

                              {/* View Live Article */}
                              <a
                                href={liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 transition-all rounded"
                                title="View Live Article"
                              >
                                <ExternalLink size={17} />
                              </a>

                              {/* Delete Article */}
                              <button 
                                disabled={deletingIds.includes(article.id)}
                                onClick={() => setArticleToDelete(article.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded disabled:opacity-50"
                                title="Cease Circulation (Delete)"
                              >
                                {deletingIds.includes(article.id) ? (
                                  <Loader2 className="animate-spin text-red-500" size={17} />
                                ) : (
                                  <Trash2 size={17} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {articles.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-serif italic">The feed is currently empty.</p>
                  </div>
                )}
              </div>
             </div>
          </section>
        ) : view === 'create-contributor' ? (
          <CreateContributorTab onSuccess={() => setView('manage-contributors')} />
        ) : view === 'manage-contributors' ? (
          <ManageContributorsTab onNavigateCreate={() => setView('create-contributor')} />
        ) : (
          <section className="max-w-2xl bg-white p-8 border border-slate-200 text-center py-16">
            <ShieldAlert size={48} className="mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-editorial font-bold text-slate-900 mb-2">Access Restricted</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              You do not have permission to view or manage this section. Please contact your system administrator to update your role permissions.
            </p>
          </section>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {(articleToDelete || eventToDelete || expertToDelete || spotlightToDelete) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-md w-full p-8 border border-slate-200 shadow-2xl"
          >
            <h3 className="text-xl font-editorial font-bold mb-4">
              {articleToDelete ? "Cease Circulation?" : 
               eventToDelete ? "Cancel Event?" : 
               expertToDelete ? "Remove Expert?" :
               "Delete Spotlight?"}
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {articleToDelete 
                ? "This action will permanently remove this story from the public feed. It cannot be recovered."
                : eventToDelete
                ? "This action will permanently remove this event from the calendar. It cannot be recovered."
                : expertToDelete
                ? "This action will remove the expert profile and their linked credentials from the public network."
                : "This action will permanently remove this founder spotlight story. It cannot be recovered."
              }
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setArticleToDelete(null);
                  setEventToDelete(null);
                  setExpertToDelete(null);
                  setSpotlightToDelete(null);
                }}
                className="flex-1 py-3 border border-slate-200 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors"
              >
                {articleToDelete ? "Retain Story" : 
                 eventToDelete ? "Keep Event" : 
                 expertToDelete ? "Retain Expert" :
                 "Retain Spotlight"}
              </button>
              <button 
                disabled={
                  articleToDelete ? deletingIds.includes(articleToDelete) : 
                  eventToDelete ? deletingEventIds.includes(eventToDelete!) :
                  expertToDelete ? deletingExpertIds.includes(expertToDelete!) :
                  deletingSpotlightIds.includes(spotlightToDelete!)
                }
                onClick={() => {
                  if (articleToDelete) handleDelete(articleToDelete);
                  else if (eventToDelete) handleEventDelete(eventToDelete);
                  else if (expertToDelete) handleExpertDelete(expertToDelete);
                  else if (spotlightToDelete) handleSpotlightDelete(spotlightToDelete);
                }}
                className="flex-1 py-3 bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-red-700 transition-colors disabled:bg-slate-300"
              >
                {articleToDelete 
                  ? (deletingIds.includes(articleToDelete) ? "Decommissioning..." : "Confirm Deletion")
                  : eventToDelete
                  ? (deletingEventIds.includes(eventToDelete!) ? "Removing..." : "Confirm Cancellation")
                  : expertToDelete
                  ? (deletingExpertIds.includes(expertToDelete!) ? "Removing..." : "Confirm Removal")
                  : (deletingSpotlightIds.includes(spotlightToDelete!) ? "Removing..." : "Confirm Deletion")
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Password / First-Login Security Setup Modal */}
      <ChangePasswordModal
        isOpen={Boolean(user?.mustChangePassword || changePasswordModalOpen)}
        isMandatoryFirstLogin={Boolean(user?.mustChangePassword)}
        user={user}
        onSuccess={() => {
          setChangePasswordModalOpen(false);
        }}
        onClose={() => setChangePasswordModalOpen(false)}
      />

      {/* Edit Article Modal */}
      <EditArticleModal
        article={editingArticle}
        isOpen={Boolean(editingArticle)}
        onClose={() => {
          setEditingArticle(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('edit');
          nextParams.delete('articleId');
          setSearchParams(nextParams, { replace: true });
        }}
        onSuccess={(updated) => {
          setArticles(prev => prev.map(a => (a.id === updated.id || (a as any)._id === updated.id) ? updated : a));
          setEditingArticle(null);
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('edit');
          nextParams.delete('articleId');
          setSearchParams(nextParams, { replace: true });
        }}
      />

      {/* Edit Spotlight Modal */}
      <EditSpotlightModal
        story={editingSpotlight}
        isOpen={Boolean(editingSpotlight)}
        onClose={() => setEditingSpotlight(null)}
        onSuccess={(updated) => {
          setSpotlights(prev => prev.map(s => s.id === updated.id ? updated : s));
          setEditingSpotlight(null);
        }}
      />
    </div>
  );
}
