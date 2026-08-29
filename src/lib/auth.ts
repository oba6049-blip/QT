// src/lib/auth.ts
// Pure local & API authentication module with Role-Based Access Control (RBAC)
import { UserRole, DashboardTab } from "../types";

export const ADMIN_EMAIL = "subairnurudeen20@gmail.com";
export const ADMIN_MASTER_PASSWORD = "Subair__@09";

export interface AdminUserSession {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  allowedTabs: DashboardTab[];
  designation?: string;
  photoURL?: string | null;
  mustChangePassword?: boolean;
  status?: 'active' | 'suspended';
  emailVerified?: boolean;
}

export type AppUser = AdminUserSession;

const AUTH_STORAGE_KEY = "techquo_admin_session";
const LEGACY_STORAGE_KEY = "quotient_admin_session";

export function getStoredAdminUser(): AdminUserSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.email === "string") {
        // Ensure allowedTabs array exists
        if (!parsed.allowedTabs) {
          if (parsed.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || parsed.role === "superadmin") {
            parsed.allowedTabs = [
              "create",
              "manage",
              "create-contributor",
              "manage-contributors",
              "create-event",
              "manage-events",
              "create-expert",
              "manage-experts",
              "create-spotlight",
              "manage-spotlight",
              "storage",
              "team",
            ];
          } else {
            parsed.allowedTabs = ["create", "manage", "create-contributor", "manage-contributors"];
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return null;
}

export function setStoredAdminUser(user: AdminUserSession | null) {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (e) {
    // Ignore storage write errors
  }
  try {
    window.dispatchEvent(new CustomEvent("techquo_auth_changed", { detail: user }));
    window.dispatchEvent(new CustomEvent("quotient_auth_changed", { detail: user }));
  } catch (e) {}
}

/**
 * Check if the user is a superadmin
 */
export function isSuperAdmin(user: AdminUserSession | null | undefined): boolean {
  if (!user) return false;
  return user.role === "superadmin" || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if user has permission to access a specific tab
 */
export function hasAccessToTab(user: AdminUserSession | null | undefined, tab: DashboardTab | string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.allowedTabs?.includes("*" as any)) return true;
  return Array.isArray(user.allowedTabs) && user.allowedTabs.includes(tab as DashboardTab);
}

/**
 * Validates editorial admin credentials via server API with fallback for local resilience.
 */
export async function signInAdminWithEmail(
  email: string,
  password: string
): Promise<{ user: AdminUserSession | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { user: null, error: "Please enter both email and password." };
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        setStoredAdminUser(data.user);
        return { user: data.user, error: null };
      }
    } else {
      const err = await res.json().catch(() => ({}));
      return { user: null, error: err.error || "Authentication failed. Please verify your credentials." };
    }
  } catch (netErr) {
    console.warn("API login failed, checking root offline credentials fallback...", netErr);
    // Offline / fallback verification for root admin
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_MASTER_PASSWORD) {
      const adminSession: AdminUserSession = {
        uid: "admin_subairnurudeen_09",
        email: ADMIN_EMAIL,
        displayName: "Nurudeen Subair",
        role: "superadmin",
        allowedTabs: [
          "create",
          "manage",
          "create-contributor",
          "manage-contributors",
          "create-event",
          "manage-events",
          "create-expert",
          "manage-experts",
          "create-spotlight",
          "manage-spotlight",
          "storage",
          "team",
        ],
        designation: "Editor-in-Chief & Super Admin",
        photoURL: null,
        emailVerified: true,
      };

      setStoredAdminUser(adminSession);
      return { user: adminSession, error: null };
    }
  }

  return { user: null, error: `Access restricted. Unable to authenticate ${cleanEmail}.` };
}

export function updateStoredAdminUser(updates: Partial<AdminUserSession>): AdminUserSession | null {
  const current = getStoredAdminUser();
  if (current) {
    const updated = { ...current, ...updates };
    setStoredAdminUser(updated);
    return updated;
  }
  return null;
}

/**
 * Changes the user's password and clears first-time change requirement
 */
export async function changeUserPassword(
  email: string,
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; user?: AdminUserSession; error?: string }> {
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        currentPassword: currentPassword || "",
        newPassword: newPassword,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.user) {
        setStoredAdminUser(data.user);
      } else {
        updateStoredAdminUser({ mustChangePassword: false });
      }
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || "Failed to update password." };
    }
  } catch (err: any) {
    // Fallback for offline root admin
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      updateStoredAdminUser({ mustChangePassword: false });
      return { success: true, user: getStoredAdminUser() || undefined };
    }
    return { success: false, error: err.message || "Network error while updating password." };
  }
}

export async function logout(): Promise<void> {
  setStoredAdminUser(null);
}
