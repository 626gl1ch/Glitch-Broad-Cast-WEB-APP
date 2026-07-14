import { showInterstitialAd } from "./utils/admob";

const getBaseUrl = () => {
  return localStorage.getItem("backendUrl") || import.meta.env.VITE_API_URL || "http://localhost:8787/api";
};

const getAppKeys = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_keys") || "{}");
  } catch(e) {
    return {};
  }
};

async function req(path, options = {}) {
  const BASE = getBaseUrl();
  const keys = getAppKeys();
  const jwt = localStorage.getItem("supabase_jwt");
  
  const headers = { 
    "Content-Type": "application/json",
    "Authorization": jwt ? `Bearer ${jwt}` : "",
    "x-gemini-key": keys.GEMINI_API_KEY || "",
    "x-meta-page-token": keys.META_PAGE_ACCESS_TOKEN || "",
    "x-meta-ig-id": keys.META_IG_BUSINESS_ACCOUNT_ID || "",
    "x-linkedin-token": keys.LINKEDIN_ACCESS_TOKEN || ""
  };

  const res = await fetch(`${BASE}${path}`, {
    headers: { ...headers, ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Chat
  getChatHistory: () => req("/chat"),
  sendChat: (message) => req("/chat", { method: "POST", body: JSON.stringify({ message }) }),

  // Compose
  getMe: () => req("/me"),
  generateVariants: async (payload) => {
    try {
      await showInterstitialAd();
    } catch (e) {
      console.log("Ad display notice", e);
    }
    return req("/compose/generate", { method: "POST", body: JSON.stringify(payload) });
  },
  listPosts: () => req("/compose"),
  updateVariant: (id, payload) =>
    req(`/compose/variant/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  // Publish
  publishVariant: (variantId, imageUrl) =>
    req(`/publish/${variantId}`, { method: "POST", body: JSON.stringify({ imageUrl }) }),

  // Groups (assisted posting)
  queueGroupPost: (variantId, groupUrl) =>
    req("/groups/queue", { method: "POST", body: JSON.stringify({ variantId, groupUrl }) }),
  getGroupQueue: () => req("/groups/queue"),
  runGroupPost: (id, imagePath) =>
    req(`/groups/queue/${id}/run`, { method: "POST", body: JSON.stringify({ imagePath }) }),
  confirmGroupPost: (id) => req(`/groups/queue/${id}/confirm`, { method: "POST" }),

  // Files
  listFiles: (folder) => req(`/files${folder ? `?folder=${folder}` : ""}`),
  deleteFile: (id) => req(`/files/${id}`, { method: "DELETE" }),
  uploadFile: async (file, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    
    const BASE = getBaseUrl();
    const keys = getAppKeys();
    const jwt = localStorage.getItem("supabase_jwt");
    
    const headers = {
      "Authorization": jwt ? `Bearer ${jwt}` : "",
      "x-gemini-key": keys.GEMINI_API_KEY || "",
      "x-meta-page-token": keys.META_PAGE_ACCESS_TOKEN || "",
      "x-meta-ig-id": keys.META_IG_BUSINESS_ACCOUNT_ID || "",
      "x-linkedin-token": keys.LINKEDIN_ACCESS_TOKEN || ""
    };

    const res = await fetch(`${BASE}/files/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Upload failed: ${res.status}`);
    }
    return res.json();
  },

  // Schedule
  schedulePost: (postId, scheduledFor) =>
    req(`/schedule/${postId}`, { method: "POST", body: JSON.stringify({ scheduledFor }) }),
  getCalendar: (from, to) => req(`/schedule/calendar?from=${from || ""}&to=${to || ""}`),
};
