import { PlatformAnalyticsOverview, DailyAnalyticsData } from "../types";

const TRACKED_KEY_PREFIX = "techquo_viewed_";
const VISITOR_ID_KEY = "techquo_visitor_id";

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return "v_guest";
  }
}

export async function fetchPlatformAnalytics(): Promise<PlatformAnalyticsOverview> {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) {
    throw new Error(`Failed to fetch platform analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDailyAnalytics(days: number = 30): Promise<DailyAnalyticsData[]> {
  const res = await fetch(`/api/analytics/daily?days=${days}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch daily analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function trackArticleRead(articleIdOrSlug: string): Promise<number | null> {
  if (!articleIdOrSlug) return null;
  const storageKey = `${TRACKED_KEY_PREFIX}art_${articleIdOrSlug}`;

  // Deduplicate per session (don't recount on rapid re-renders)
  try {
    if (sessionStorage.getItem(storageKey)) {
      return null;
    }
  } catch {
    // Ignore storage restrictions
  }

  try {
    const visitorId = getOrCreateVisitorId();
    const res = await fetch(`/api/articles/${encodeURIComponent(articleIdOrSlug)}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    });
    if (res.ok) {
      const data = await res.json();
      try {
        sessionStorage.setItem(storageKey, Date.now().toString());
      } catch {}
      return data.views || null;
    }
  } catch (err) {
    console.warn("[Analytics] Could not record article view:", err);
  }
  return null;
}

export async function trackSpotlightRead(spotlightIdOrSlug: string): Promise<number | null> {
  if (!spotlightIdOrSlug) return null;
  const storageKey = `${TRACKED_KEY_PREFIX}spot_${spotlightIdOrSlug}`;

  // Deduplicate per session
  try {
    if (sessionStorage.getItem(storageKey)) {
      return null;
    }
  } catch {
    // Ignore storage restrictions
  }

  try {
    const visitorId = getOrCreateVisitorId();
    const res = await fetch(`/api/spotlight/${encodeURIComponent(spotlightIdOrSlug)}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    });
    if (res.ok) {
      const data = await res.json();
      try {
        sessionStorage.setItem(storageKey, Date.now().toString());
      } catch {}
      return data.views || null;
    }
  } catch (err) {
    console.warn("[Analytics] Could not record spotlight view:", err);
  }
  return null;
}

export async function trackPlatformPageView(path: string = window.location.pathname): Promise<void> {
  const storageKey = `${TRACKED_KEY_PREFIX}page_${path}`;
  try {
    if (sessionStorage.getItem(storageKey)) {
      return;
    }
  } catch {}

  try {
    const visitorId = getOrCreateVisitorId();
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", path, visitorId }),
    });
    try {
      sessionStorage.setItem(storageKey, Date.now().toString());
    } catch {}
  } catch {}
}
