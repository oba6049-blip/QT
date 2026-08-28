import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { signInAdminWithEmail, ADMIN_EMAIL } from "../lib/auth";

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in with valid session, redirect directly to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/admin");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your administrator email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInAdminWithEmail(cleanEmail, password);
      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.user) {
        navigate("/admin");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign in.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top bar back link */}
      <div className="max-w-md w-full mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={14} /> Back to Quotients Africa
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white border border-slate-200 shadow-sm p-8 sm:p-10 rounded-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-full mb-4">
            <Lock size={20} className="text-white" />
          </div>
          
          <h1 className="font-editorial text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">
            Quotients Africa<span className="text-brand-accent">.</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Editorial Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r text-red-800 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@quotientsafrica.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black focus:outline-none text-sm text-slate-900 rounded-sm transition-all"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black focus:outline-none text-sm text-slate-900 rounded-sm transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-black text-white hover:bg-brand-accent transition-colors py-3 px-4 text-xs font-bold uppercase tracking-widest rounded-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Sign In to Editorial Console
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Authorized editorial staff only. All administrative activities and publishing events are logged for integrity.
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="max-w-md w-full mx-auto text-center mt-6">
        <p className="text-[11px] text-slate-400 font-mono">
          &copy; {new Date().getFullYear()} Quotients Africa Publication
        </p>
      </div>
    </div>
  );
}
