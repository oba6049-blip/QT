import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Calendar,
  Cloud,
  Check,
  X,
  FileText,
  Mail,
  User,
  UserX,
  Sliders,
  Radio,
  Clock
} from "lucide-react";
import { DashboardUser, UserRole, DashboardTab, DashboardTabOption } from "../types";
import { useAuth } from "../lib/AuthContext";
import { isSuperAdmin } from "../lib/auth";

export const AVAILABLE_TABS: DashboardTabOption[] = [
  {
    id: "analytics",
    label: "Readership Analytics",
    category: "Analytics",
    description: "Real-time reader tracking across publication sections, spotlight stories, and daily platform traffic",
  },
  {
    id: "create",
    label: "Publish Story",
    category: "Editorial",
    description: "Create and publish new long-form articles, reports, and analyses",
  },
  {
    id: "manage",
    label: "Manage Feed",
    category: "Editorial",
    description: "Edit, feature, unpublish, or delete existing live stories",
  },
  {
    id: "create-event",
    label: "Post Event",
    category: "Events",
    description: "Publish upcoming industry summits, webinars, and conferences",
  },
  {
    id: "manage-events",
    label: "Manage Events",
    category: "Events",
    description: "Update event registrations, schedules, and archive past events",
  },
  {
    id: "create-expert",
    label: "Add Expert",
    category: "Experts",
    description: "Register new contributing analysts and thought leaders",
  },
  {
    id: "manage-experts",
    label: "Manage Experts",
    category: "Experts",
    description: "Update expert bios, designations, and social connections",
  },
  {
    id: "create-spotlight",
    label: "Add Spotlight",
    category: "Spotlights",
    description: "Publish featured founder profiles and emerging venture case studies",
  },
  {
    id: "manage-spotlight",
    label: "Manage Spotlight",
    category: "Spotlights",
    description: "Curate and update the homepage founder spotlights reel",
  },
  {
    id: "storage",
    label: "S3 & Storage",
    category: "System",
    description: "Configure AWS S3 bucket keys, CDN assets, and cloud endpoints",
  },
  {
    id: "team",
    label: "Team & Permissions",
    category: "System",
    description: "Add team members, grant permissions, and configure dashboard access",
  },
];

const ROLE_PRESETS: {
  role: UserRole;
  title: string;
  badgeClass: string;
  description: string;
  defaultTabs: DashboardTab[];
}[] = [
  {
    role: "superadmin",
    title: "Super Admin",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    description: "Unrestricted access to all editorial tools, team administration, and system storage.",
    defaultTabs: [
      "analytics",
      "create",
      "manage",
      "create-event",
      "manage-events",
      "create-expert",
      "manage-experts",
      "create-spotlight",
      "manage-spotlight",
      "storage",
      "team",
    ],
  },
  {
    role: "editor",
    title: "Senior Editor",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
    description: "Comprehensive content curation across stories, events, spotlights, and expert network.",
    defaultTabs: [
      "analytics",
      "create",
      "manage",
      "create-event",
      "manage-events",
      "create-expert",
      "manage-experts",
      "create-spotlight",
      "manage-spotlight",
    ],
  },
  {
    role: "author",
    title: "Author / Staff Writer",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    description: "Publish stories and review feed articles.",
    defaultTabs: ["analytics", "create", "manage"],
  },
  {
    role: "event_manager",
    title: "Events Coordinator",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    description: "Organize, post, and coordinate industry events and summits.",
    defaultTabs: ["create-event", "manage-events"],
  },
  {
    role: "custom",
    title: "Custom Access",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Tailored individual permissions specified by explicit tab selections.",
    defaultTabs: ["create"],
  },
];

export default function TeamManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);

  // Form fields
  const [formEmail, setFormEmail] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("author");
  const [formAllowedTabs, setFormAllowedTabs] = useState<DashboardTab[]>(["create", "manage"]);
  const [formStatus, setFormStatus] = useState<"active" | "suspended">("active");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset modal state
  const [resetModalUser, setResetModalUser] = useState<DashboardUser | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Delete user confirmation modal state
  const [deleteModalUser, setDeleteModalUser] = useState<DashboardUser | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load team members.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to users service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormEmail("");
    setFormDisplayName("");
    setFormDesignation("Staff Contributor");
    setFormPassword(generateRandomPassword());
    setFormRole("author");
    setFormAllowedTabs(["create", "manage"]);
    setFormStatus("active");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (user: DashboardUser) => {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormDisplayName(user.displayName || "");
    setFormDesignation(user.designation || "");
    setFormPassword(""); // Leave blank if not changing
    setFormRole(user.role || "author");
    setFormAllowedTabs(user.allowedTabs || ["create"]);
    setFormStatus(user.status || "active");
    setFormError(null);
    setModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    const preset = ROLE_PRESETS.find((p) => p.role === role);
    if (preset && role !== "custom") {
      setFormAllowedTabs([...preset.defaultTabs]);
    }
  };

  const toggleTab = (tabId: DashboardTab) => {
    setFormAllowedTabs((prev) => {
      let next: DashboardTab[];
      if (prev.includes(tabId)) {
        next = prev.filter((t) => t !== tabId);
      } else {
        next = [...prev, tabId];
      }
      // If user manually customizes tabs and doesn't match current preset, switch role to 'custom'
      const matchedPreset = ROLE_PRESETS.find(
        (p) => p.role !== "custom" && p.defaultTabs.length === next.length && p.defaultTabs.every((t) => next.includes(t))
      );
      if (!matchedPreset) {
        setFormRole("custom");
      } else {
        setFormRole(matchedPreset.role);
      }
      return next;
    });
  };

  const selectAllTabs = () => {
    setFormAllowedTabs(AVAILABLE_TABS.map((t) => t.id));
    setFormRole("superadmin");
  };

  const clearAllTabs = () => {
    setFormAllowedTabs([]);
    setFormRole("custom");
  };

  function generateRandomPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Q#${pwd}`;
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = formEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setFormError("Email address is required.");
      return;
    }

    if (!editingUser && !formPassword) {
      setFormError("A temporary password is required for new users.");
      return;
    }

    if (formAllowedTabs.length === 0) {
      setFormError("Please select at least one dashboard tab permission for this user.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          email: cleanEmail,
          displayName: formDisplayName.trim(),
          designation: formDesignation.trim(),
          role: formRole,
          allowedTabs: formAllowedTabs,
          status: formStatus,
        };
        if (formPassword) {
          payload.password = formPassword;
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSuccessMessage(`User "${cleanEmail}" updated successfully.`);
          setModalOpen(false);
          fetchUsers();
        } else {
          const err = await res.json();
          setFormError(err.error || "Failed to update user.");
        }
      } else {
        // Create user
        const payload = {
          email: cleanEmail,
          password: formPassword,
          displayName: formDisplayName.trim() || cleanEmail.split("@")[0],
          designation: formDesignation.trim() || "Staff Contributor",
          role: formRole,
          allowedTabs: formAllowedTabs,
          status: formStatus,
        };

        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSuccessMessage(`New staff account for "${cleanEmail}" created successfully.`);
          setModalOpen(false);
          fetchUsers();
        } else {
          const err = await res.json();
          setFormError(err.error || "Failed to create user.");
        }
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred while saving user.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = (userToDelete: DashboardUser) => {
    if (userToDelete.email.toLowerCase() === "subairnurudeen20@gmail.com") {
      alert("The primary Super Administrator account cannot be deleted.");
      return;
    }
    setDeleteModalUser(userToDelete);
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteModalUser) return;
    if (deleteModalUser.email.toLowerCase() === "subairnurudeen20@gmail.com") {
      alert("The primary Super Administrator account cannot be deleted.");
      setDeleteModalUser(null);
      return;
    }

    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/users/${deleteModalUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage(`Account for ${deleteModalUser.displayName || deleteModalUser.email} has been permanently deleted.`);
        setDeleteModalUser(null);
        if (editingUser?.id === deleteModalUser.id) {
          setModalOpen(false);
        }
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user account.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting user account.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetPasswordValue.trim()) return;

    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/users/${resetModalUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          password: resetPasswordValue.trim(),
          mustChangePassword: true 
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Password for ${resetModalUser.email} reset. User must choose a new password on their next login.`);
        setResetModalUser(null);
        setResetPasswordValue("");
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reset password.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reset password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  // Group tabs by category
  const categories = ["Editorial", "Events", "Experts", "Spotlights", "System"] as const;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} className="text-purple-600" />
            Role-Based Access Control (RBAC)
          </div>
          <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-slate-900">
            Editorial Team & Permissions
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage authorized staff accounts, assign granular role presets, and specify exact tab permissions for each team member across the publication.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-2"
            title="Refresh team members"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-black hover:bg-brand-accent text-white rounded transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm"
          >
            <UserPlus size={16} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center justify-between text-sm font-medium"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded flex items-center gap-3 text-sm font-medium">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Role Summary Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_PRESETS.filter((p) => p.role !== "custom").map((preset) => {
          const userCount = users.filter((u) => u.role === preset.role).length;
          return (
            <div
              key={preset.role}
              className="bg-white border border-slate-200 p-5 rounded flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${preset.badgeClass}`}
                  >
                    {preset.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {userCount} {userCount === 1 ? "member" : "members"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  {preset.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                <Sliders size={12} />
                <span>{preset.defaultTabs.length} enabled sections</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Users Table / Cards */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-editorial text-lg font-bold text-slate-900">
              Active Team Accounts ({users.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Users can log in with their email and access specifically delegated dashboard tabs.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin text-brand-accent" />
            <p className="text-xs uppercase font-bold tracking-widest">Loading staff roster...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-bold">No additional staff members found.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Staff Member" to delegate access to other editors or authors.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((member) => {
              const isRootAdmin = member.email.toLowerCase() === "subairnurudeen20@gmail.com";
              const isCurrent = currentUser?.email?.toLowerCase() === member.email.toLowerCase();
              const preset = ROLE_PRESETS.find((p) => p.role === member.role) || ROLE_PRESETS[4];

              return (
                <div
                  key={member.id}
                  className={`p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/60 transition-colors ${
                    member.status === "suspended" ? "opacity-60 bg-slate-50/80" : ""
                  }`}
                >
                  {/* Left Column: User identity & role */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                        isRootAdmin
                          ? "bg-purple-900 text-white border-purple-700"
                          : member.role === "editor"
                          ? "bg-blue-900 text-white border-blue-700"
                          : "bg-slate-800 text-white border-slate-700"
                      }`}
                    >
                      {member.displayName
                        ? member.displayName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : member.email.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-base leading-none">
                          {member.displayName || "Staff Member"}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded">
                            You
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${preset.badgeClass}`}
                        >
                          {preset.title}
                        </span>
                        {member.mustChangePassword && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200 flex items-center gap-1">
                            <Key size={10} className="text-amber-600" />
                            First-Login Setup Pending
                          </span>
                        )}
                        {member.status === "suspended" && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200">
                            Suspended
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-slate-700 font-medium">
                          <Mail size={12} className="text-slate-400" />
                          {member.email}
                        </span>
                        {member.designation && (
                          <span className="text-slate-400">• {member.designation}</span>
                        )}
                        {member.lastLoginAt && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock size={11} />
                            Active {new Date(member.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Allowed Tab Badges */}
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1">
                          Accessible Tabs:
                        </span>
                        {member.role === "superadmin" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 rounded text-[11px] font-mono font-medium">
                            <Sparkles size={11} className="text-purple-600" /> All Dashboard Tabs (Full Superadmin)
                          </span>
                        ) : member.allowedTabs && member.allowedTabs.length > 0 ? (
                          member.allowedTabs.map((tabId) => {
                            const tabInfo = AVAILABLE_TABS.find((t) => t.id === tabId);
                            return (
                              <span
                                key={tabId}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200"
                              >
                                {tabInfo ? tabInfo.label : tabId}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-red-500 font-medium">No tabs assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <button
                      onClick={() => {
                        setResetModalUser(member);
                        setResetPasswordValue(generateRandomPassword());
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      title="Reset user password"
                    >
                      <Key size={12} />
                      Password
                    </button>

                    <button
                      onClick={() => openEditModal(member)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-brand-accent text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 size={12} />
                      Edit Roles
                    </button>

                    {!isRootAdmin && (
                      <button
                        onClick={() => handleDeleteUser(member)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-3xl rounded shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-black text-white rounded flex items-center justify-center">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-slate-900">
                      {editingUser ? `Edit Staff Account: ${editingUser.email}` : "Add New Editorial Staff"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Assign identity credentials and configure allowed dashboard sections.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-black transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveUser} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {formError && (
                  <div className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs flex items-center gap-2 rounded-r">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Identity Information */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amara Nwosu"
                      value={formDisplayName}
                      onChange={(e) => setFormDisplayName(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black outline-hidden text-sm rounded transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address (Login ID)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="amara.nwosu@techquonews.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      disabled={editingUser?.email.toLowerCase() === "subairnurudeen20@gmail.com"}
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black outline-hidden text-sm rounded transition-all disabled:opacity-60 font-mono"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Editorial Designation / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Fintech Analyst & Contributor"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black outline-hidden text-sm rounded transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span>{editingUser ? "New Password (Optional)" : "Initial Password"}</span>
                      {!editingUser && (
                        <button
                          type="button"
                          onClick={() => setFormPassword(generateRandomPassword())}
                          className="text-[10px] text-brand-accent hover:underline lowercase font-mono font-normal"
                        >
                          generate strong
                        </button>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={editingUser ? "Leave blank to keep unchanged" : "••••••••••••"}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black outline-hidden text-sm rounded font-mono transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {!editingUser && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        🔒 The user will be required to change this temporary password to their own password on their first login.
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Preset Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Staff Role Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {ROLE_PRESETS.map((preset) => (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleRoleChange(preset.role)}
                        className={`p-3 border rounded text-left transition-all ${
                          formRole === preset.role
                            ? "border-black bg-black text-white shadow-xs"
                            : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.title}</div>
                        <div
                          className={`text-[10px] mt-1 ${
                            formRole === preset.role ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {preset.defaultTabs.length} tabs
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Tab Access Matrix */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                        Granular Tab Access Matrix
                      </label>
                      <p className="text-xs text-slate-500">
                        Check each individual dashboard view this staff member is authorized to access.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllTabs}
                        className="text-[11px] font-bold text-slate-600 hover:text-black uppercase tracking-wider"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={clearAllTabs}
                        className="text-[11px] font-bold text-slate-600 hover:text-black uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Tabs by Category */}
                  <div className="space-y-4">
                    {categories.map((cat) => {
                      const categoryTabs = AVAILABLE_TABS.filter((t) => t.category === cat);
                      if (categoryTabs.length === 0) return null;

                      return (
                        <div key={cat} className="p-4 bg-slate-50/80 border border-slate-200 rounded">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
                            {cat} Section
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2.5">
                            {categoryTabs.map((tab) => {
                              const isChecked = formAllowedTabs.includes(tab.id);
                              return (
                                <label
                                  key={tab.id}
                                  className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-white border-black text-slate-900 shadow-xs"
                                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleTab(tab.id)}
                                    className="mt-0.5 w-4 h-4 text-black rounded border-slate-300 focus:ring-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold leading-none">{tab.label}</div>
                                    <div className="text-[11px] text-slate-500 leading-tight mt-1">
                                      {tab.description}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Account Status Toggle */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between p-4 bg-slate-50 rounded">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                      Account Status
                    </label>
                    <p className="text-xs text-slate-500">
                      Suspended users are immediately blocked from logging into the portal.
                    </p>
                  </div>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    disabled={editingUser?.email.toLowerCase() === "subairnurudeen20@gmail.com"}
                    className="p-2.5 bg-white border border-slate-300 font-bold text-xs uppercase tracking-wider rounded outline-hidden"
                  >
                    <option value="active">Active & Authorized</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {editingUser && editingUser.email.toLowerCase() !== "subairnurudeen20@gmail.com" && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteModalUser(editingUser);
                        }}
                        className="px-3.5 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={13} />
                        Delete Account
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-6 py-2.5 bg-black hover:bg-brand-accent text-white rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {formSubmitting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Saving User...
                        </>
                      ) : editingUser ? (
                        "Save Permission Changes"
                      ) : (
                        "Create Staff Account"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {resetModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <Key size={18} className="text-brand-accent" />
                  Reset Staff Password
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="text-slate-400 hover:text-black"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4">
                Set a new login password for <strong>{resetModalUser.email}</strong>.
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    New Temporary Password
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black font-mono text-sm rounded outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setResetPasswordValue(generateRandomPassword())}
                      className="absolute inset-y-0 right-0 pr-3 text-[10px] text-brand-accent font-bold uppercase tracking-wider"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 text-xs font-bold uppercase text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 bg-black hover:bg-brand-accent text-white text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                  >
                    {resetSubmitting ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {deleteModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-red-200 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden"
            >
              {/* Danger Modal Header */}
              <div className="bg-red-50 border-b border-red-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-red-950">
                      Delete Team Member Account
                    </h3>
                    <p className="text-xs text-red-700">
                      This action is permanent and cannot be undone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteModalUser(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Account Details Box */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete the following staff user? All dashboard access, permissions, and session credentials for this user will be permanently revoked.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">User Email</span>
                    <span className="font-mono text-xs font-bold text-slate-900">{deleteModalUser.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Display Name</span>
                    <span className="text-xs font-medium text-slate-800">{deleteModalUser.displayName || "Not configured"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role & Title</span>
                    <span className="text-xs font-medium text-slate-800">
                      {deleteModalUser.designation || deleteModalUser.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Tabs</span>
                    <span className="text-xs font-medium text-slate-800">
                      {deleteModalUser.role === "superadmin"
                        ? "All Tabs"
                        : `${deleteModalUser.allowedTabs?.length || 0} tabs`}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldAlert size={15} className="shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Existing articles or events authored by this user will remain published under their recorded byline in the archive.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={handleConfirmDeleteUser}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {deleteSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Deleting Account...
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      Confirm & Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
