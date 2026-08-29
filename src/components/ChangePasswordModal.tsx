import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Key,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  X,
  Layers,
  Check
} from "lucide-react";
import { AdminUserSession, changeUserPassword } from "../lib/auth";
import { AVAILABLE_TABS } from "./TeamManagement";

interface ChangePasswordModalProps {
  isOpen: boolean;
  isMandatoryFirstLogin?: boolean;
  user: AdminUserSession | null;
  onSuccess: (updatedUser: AdminUserSession) => void;
  onClose?: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  isMandatoryFirstLogin = false,
  user,
  onSuccess,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match. Please verify.");
      return;
    }

    if (!isMandatoryFirstLogin && !currentPassword) {
      setError("Please enter your current password to proceed.");
      return;
    }

    setLoading(true);
    try {
      const res = await changeUserPassword(user.email, newPassword, currentPassword);
      if (res.success && res.user) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(res.user!);
          if (onClose) onClose();
        }, 1200);
      } else {
        setError(res.error || "Unable to update password. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 6;
  const hasMixedChars = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-6 relative">
            {!isMandatoryFirstLogin && onClose && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-accent">
                {isMandatoryFirstLogin ? <Sparkles size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold tracking-tight">
                  {isMandatoryFirstLogin ? "First-Time Security Setup" : "Update Account Password"}
                </h3>
                <p className="text-xs text-slate-300">
                  {isMandatoryFirstLogin
                    ? "Welcome to TechQuo News! Please set your personal password."
                    : `Manage security credentials for ${user.email}`}
                </p>
              </div>
            </div>

            {/* Assigned Role & Tab Preview (Mandatory First Login) */}
            {isMandatoryFirstLogin && (
              <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/50 -mx-6 -mb-6 p-6">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-brand-accent" />
                    Assigned Editorial Role
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-brand-accent text-slate-950">
                    {user.role === "superadmin"
                      ? "Super Admin"
                      : user.role === "editor"
                      ? "Editor-in-Chief"
                      : user.role === "event_manager"
                      ? "Events Manager"
                      : user.role}
                  </span>
                </div>

                <div className="text-xs text-slate-300 mb-3">
                  You have been granted access to the following workspace tabs:
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {user.role === "superadmin" ? (
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded font-mono">
                      ✨ All Editorial & System Tabs (Full Access)
                    </span>
                  ) : user.allowedTabs && user.allowedTabs.length > 0 ? (
                    user.allowedTabs.map((tabId) => {
                      const tabInfo = AVAILABLE_TABS.find((t) => t.id === tabId);
                      return (
                        <span
                          key={tabId}
                          className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded"
                        >
                          {tabInfo ? tabInfo.label : tabId}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-400 text-xs">Standard Editorial View</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-editorial text-xl font-bold text-slate-900">
                  Password Updated Successfully!
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your credentials have been securely saved. Loading your personalized editorial dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Current Password (Required only if not first-time mandatory reset) */}
                {!isMandatoryFirstLogin && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-accent focus:bg-white pr-10 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    {isMandatoryFirstLogin ? "Create New Personal Password" : "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-accent focus:bg-white pr-10 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Requirements Hint */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 font-bold" : ""}`}>
                      <Check size={12} className={hasMinLength ? "text-emerald-600" : "text-slate-300"} />
                      6+ characters
                    </span>
                    <span className={`flex items-center gap-1 ${hasMixedChars ? "text-emerald-600 font-bold" : ""}`}>
                      <Check size={12} className={hasMixedChars ? "text-emerald-600" : "text-slate-300"} />
                      Numbers or symbols
                    </span>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-brand-accent focus:bg-white pr-10 font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  {!isMandatoryFirstLogin && onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 border border-slate-200 rounded text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword !== confirmPassword}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>{isMandatoryFirstLogin ? "Save & Enter Dashboard" : "Update Password"}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
