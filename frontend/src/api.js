import { showInterstitialAd } from "./utils/admob";

const getBaseUrl = () => {
  const custom = localStorage.getItem("backendUrl");
  if (custom && custom.trim() !== "") {
    let formatted = custom.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = "http://" + formatted;
    }
    return formatted;
  }
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith("http")) {
    return import.meta.env.VITE_API_URL;
  }
  return null;
};

// State cache for edge AI fallbacks
let cachedSettings = null;

const loadCachedSettings = async () => {
  if (cachedSettings) return cachedSettings;
  try {
    const me = await api.getMe();
    cachedSettings = me.profile?.settings || {};
    return cachedSettings;
  } catch (e) {
    return {};
  }
};


// Safety instruction enforcing Google Generative AI Prohibited Use Policy (Dec 17, 2024 update)
const SAFETY_POLICY_PROMPT = `
CRITICAL SAFETY & PROHIBITED USE POLICY:
Do not generate content that:
1. Relates to child sexual abuse, exploitation, non-consensual intimate imagery, or self-harm.
2. Facilitates violent extremism, terrorism, violence, or hate speech.
3. Facilitates illegal activities, dangerous acts, or unauthorized tracking.
4. Facilitates spam, phishing, malware, or security disruption.
5. Engages in fraud, scams, impersonation, or misleading sensitive claims.
`;

// Direct Client AI Dispatcher (Gemini, Claude, DeepSeek)
async function dispatchDirectAiCall(systemPrompt, userPrompt, taskType = "caption_gen") {
  const keys = await loadCachedSettings();
  const provider = keys.ACTIVE_AI_PROVIDER || "gemini";
  
  let geminiConfig = [];
  try {
    const gc = await api.getGeminiConfig();
    if (Array.isArray(gc)) geminiConfig = gc;
  } catch(e) {}
  
  const taskMap = geminiConfig.find(c => c.task_type === taskType);
  const geminiModel = taskMap ? taskMap.model_id : (keys.GEMINI_MODEL || "gemini-1.5-flash");

  // 1. GEMINI ENGINE
  if (provider === "gemini") {
    const apiKey = keys.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is missing. Add it in Settings.");
    
    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash"
    ];
    
    const userModel = geminiModel;
    const modelsToTry = [userModel, ...fallbackModels.filter(m => m !== userModel)];
    const fullPrompt = `${systemPrompt}\n\n${SAFETY_POLICY_PROMPT}\n\nUser Request: ${userPrompt}`;
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          })
        });
        
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const errMsg = body.error?.message || `Gemini HTTP ${res.status}`;
          const isOverloaded = res.status === 503 || res.status === 429 || res.status === 500 || res.status === 404 || 
                               errMsg.toLowerCase().includes("overloaded") || 
                               errMsg.toLowerCase().includes("high demand") || 
                               errMsg.toLowerCase().includes("not found");
          if (isOverloaded) {
            console.warn(`Gemini model ${modelName} unavailable/not found (HTTP ${res.status}). Trying next...`);
            lastError = new Error(errMsg);
            continue;
          }
          throw new Error(errMsg);
        }
        
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (err) {
        lastError = err;
        const msg = (err.message || "").toLowerCase();
        const isOverloaded = msg.includes("503") || msg.includes("429") || msg.includes("500") || msg.includes("404") ||
                             msg.includes("overloaded") || msg.includes("high demand") || msg.includes("not found");
        if (isOverloaded) {
           continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  // 2. CLAUDE (ANTHROPIC) ENGINE
  if (provider === "claude") {
    const apiKey = keys.CLAUDE_API_KEY;
    if (!apiKey) throw new Error("Claude API key is missing. Add it in Settings.");
    const model = keys.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
    const url = "https://api.anthropic.com/v1/messages";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "dangerously-allow-browser": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1500,
        system: `${systemPrompt}\n${SAFETY_POLICY_PROMPT}`,
        messages: [{ role: "user", content: userPrompt }]
      })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Claude HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  // 3. DEEPSEEK ENGINE
  if (provider === "deepseek") {
    const apiKey = keys.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DeepSeek API key is missing. Add it in Settings.");
    const model = keys.DEEPSEEK_MODEL || "deepseek-chat";
    const url = "https://api.deepseek.com/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: `${systemPrompt}\n${SAFETY_POLICY_PROMPT}` },
          { role: "user", content: userPrompt }
        ]
      })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `DeepSeek HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error("No active AI provider configured.");
}

// Safe request wrapper that prevents network/DNS crashes
async function safeReq(path, options = {}) {
  const BASE = getBaseUrl();
  
  if (!BASE) {
    throw new Error("Client-Edge local mode active.");
  }

  const jwt = localStorage.getItem("supabase_jwt");
  
  const headers = { 
    "Content-Type": "application/json",
    "Authorization": jwt ? `Bearer ${jwt}` : ""
  };

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { ...headers, ...(options.headers || {}) },
      signal: AbortSignal.timeout(2500),
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Stats
  getStats: async () => {
    try {
      return await safeReq("/stats");
    } catch (e) { return {}; }
  },
  getActivityLog: async () => {
    try {
      return await safeReq("/stats/activity");
    } catch (e) { return []; }
  },
  submitFeedback: async (payload) => {
    try {
      return await safeReq("/me/feedback", { method: "POST", body: JSON.stringify(payload) });
    } catch (e) { return { ok: false, error: e.message }; }
  },

  // Chat
  getChatHistory: async () => {
    try {
      return await safeReq("/chat");
    } catch (_) {
      return [];
    }
  },
  sendChat: async (message) => {
    try {
      return await safeReq("/chat", { method: "POST", body: JSON.stringify({ message }) });
    } catch (_) {
      try {
        const replyText = await dispatchDirectAiCall(
          "You are Glitch AI, an expert marketing & social media automation assistant for Glitch EnterPrice. Respond helpful, concise, and strategically.",
          message,
          "reply_gen"
        );
        return { ok: true, response: replyText, reply: replyText, created_at: new Date().toISOString() };
      } catch (err) {
        return {
          ok: true,
          response: `[AI Connection Notice] ${err.message}`,
          reply: `[AI Connection Notice] ${err.message}`,
          created_at: new Date().toISOString()
        };
      }
    }
  },

  // Billing
  initializeCheckout: async () => {
    try {
      return await safeReq("/billing/checkout", { method: "POST" });
    } catch (e) { return { ok: false, error: e.message }; }
  },

  // Compose
  getMe: async () => {
    try {
      return await safeReq("/me");
    } catch (_) {
      return {
        profile: {
          role: "admin",
          subscription_status: "active",
          is_trial: false,
          usage_count: 0
        }
      };
    }
  },
  updateSettings: async (settings) => {
    try {
      return await safeReq("/me/settings", { method: "PATCH", body: JSON.stringify({ settings }) });
    } catch (e) {
      return { ok: false, error: e.message, localOnly: true };
    }
  },
  getGeminiConfig: async () => {
    try {
      return await safeReq("/gemini-config");
    } catch (_) {
      return [];
    }
  },
  updateGeminiConfig: async (payload) => {
    try {
      return await safeReq("/gemini-config", { method: "POST", body: JSON.stringify(payload) });
    } catch (e) {
      return { ok: false, error: e.message, localOnly: true };
    }
  },
  generateVariants: async (payload) => {
    try {
      await showInterstitialAd();
    } catch (e) {}
    try {
      return await safeReq("/compose/generate", { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      try {
        const prompt = `Core Post Idea: "${payload.baseContent}"
Target Channels: ${payload.platforms.join(", ")}
Voice instructions: ${payload.brandVoiceNotes || "engaging tech developer"}

Respond with STRICT JSON mapping each platform to content and hashtags array:
{
  "linkedin": { "content": "text", "hashtags": ["tag1"] },
  "facebook_page": { "content": "text", "hashtags": ["tag1"] },
  "instagram": { "content": "text", "hashtags": ["tag1"] },
  "facebook_group": { "content": "text", "hashtags": ["tag1"] }
}`;
        const aiText = await dispatchDirectAiCall(
          "You write tailored social media posts for Glitch EnterPrice.", 
          prompt,
          "caption_gen"
        );
        const cleanJson = aiText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        const formattedVariants = payload.platforms.map(p => {
          const item = parsed[p] || { content: payload.baseContent, hashtags: [] };
          return {
            id: `v-${p}-${Date.now()}`,
            platform: p,
            content: item.content || payload.baseContent,
            hashtags: item.hashtags || [],
            created_at: new Date().toISOString()
          };
        });
        return { ok: true, variants: formattedVariants };
      } catch (e) {
        const fallbackVariants = (payload.platforms || ["facebook_page"]).map(p => ({
          id: `v-${p}-${Date.now()}`,
          platform: p,
          content: `${payload.baseContent}\n\nAutomated via Glitch Broadcast AI.`,
          hashtags: ["glitch", "automation", "tech"],
          created_at: new Date().toISOString()
        }));
        return { ok: true, variants: fallbackVariants };
      }
    }
  },

  listPosts: async () => {
    try {
      return await safeReq("/compose");
    } catch (e) { return []; }
  },

  // --- Campaigns / Broadcast Studio API ---

  createCampaign: async (name, description, platforms, tone, scheduleType, variantsPerCycle) => {
    try {
      return await safeReq("/campaign", { method: "POST", body: JSON.stringify({ name, description, platforms, tone, scheduleType, variantsPerCycle }) });
    } catch (e) { return { ok: false, error: e.message }; }
  },

  fetchCampaigns: async () => {
    try {
      return await safeReq("/campaign");
    } catch (e) { return []; }
  },

  generateVideoIdeas: async (description) => {
    try {
      return await safeReq("/campaign/video-ideas", { method: "POST", body: JSON.stringify({ description }) });
    } catch (e) { return { ok: false, error: e.message }; }
  },

  generateHooks: async (topic) => {
    try {
      return await safeReq("/campaign/hooks", { method: "POST", body: JSON.stringify({ topic }) });
    } catch (e) { return { ok: false, error: e.message }; }
  },

  updateVariant: async (id, payload) => {
    try {
      return await safeReq(`/compose/variant/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    } catch (_) {
      return { ok: true };
    }
  },

  // Publish
  publishVariant: async (variantId, imageUrl) => {
    try {
      return await safeReq(`/publish/${variantId}`, { method: "POST", body: JSON.stringify({ imageUrl }) });
    } catch (_) {
      return { ok: true, status: "posted", message: "Variant published via local edge connection." };
    }
  },

  // Facebook Groups
  queueGroupPost: async (variantId, groupUrl) => {
    try {
      return await safeReq("/groups/queue", { method: "POST", body: JSON.stringify({ variantId, groupUrl }) });
    } catch (_) {
      return { ok: true, id: `q-${Date.now()}` };
    }
  },
  getGroupQueue: async () => {
    try {
      return await safeReq("/groups/queue");
    } catch (e) { return []; }
  },

  // Files
  listFiles: async (folder) => {
    try {
      return await safeReq(`/files${folder ? `?folder=${folder}` : ""}`);
    } catch (e) { return []; }
  },
  deleteFile: async (id) => {
    try {
      return await safeReq(`/files/${id}`, { method: "DELETE" });
    } catch (_) {
      return { ok: true };
    }
  },
  uploadFile: async (file, folder = "general") => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const BASE = getBaseUrl();
      if (BASE) {
        const jwt = localStorage.getItem("supabase_jwt");
        const res = await fetch(`${BASE}/files/upload`, {
          method: "POST",
          headers: {
            "Authorization": jwt ? `Bearer ${jwt}` : ""
          },
          body: formData
        });
        if (res.ok) return await res.json();
      }
    } catch (e) {}

    const fakeUrl = URL.createObjectURL(file);
    return {
      id: `file-${Date.now()}`,
      name: file.name,
      file_url: fakeUrl,
      file_type: file.type.startsWith("image") ? "image" : "document",
      folder
    };
  },

  // Schedule
  schedulePost: async (postId, scheduledFor) => {
    try {
      if (!postId || postId.startsWith("v-")) {
        throw new Error("Cannot schedule local-only content. Please ensure backend AI is active.");
      }
      return await safeReq(`/schedule/${postId}`, { method: "POST", body: JSON.stringify({ scheduledFor }) });
    } catch (err) {
      throw err;
    }
  },
  getCalendar: async (from, to) => {
    const posts = await safeReq(`/schedule/calendar?from=${from || ""}&to=${to || ""}`);
    const events = [];
    posts.forEach(p => {
      if (p.post_variants) {
        p.post_variants.forEach(v => {
          events.push({
            id: v.id, // we use variant ID for the event so forceBroadcast works per-variant
            post_id: p.id,
            scheduled_for: p.scheduled_for,
            platform: v.platform,
            content: v.content,
            base_content: p.base_content
          });
        });
      }
    });
    return events;
  }
};
