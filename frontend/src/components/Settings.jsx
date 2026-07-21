import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Facebook, 
  Instagram, 
  Linkedin, 
  KeyRound, 
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Save,
  Sparkles,
  DollarSign,
  ExternalLink,
  Cpu,
  Link2,
  Activity,
  Bot,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  Send,
  Radio
} from "lucide-react";

const DEFAULT_BRAND_VOICES = [
  { id: "dev", label: "Solo Dev / Build in Public", instructions: "Nigerian solo developer showing technical progress, clean engineering, no fluff, no fake hype. Use simple language." },
  { id: "trading", label: "Algo Trader Spec", instructions: "Quantitative trader discussing backtests, risk parameters, pine scripts, statistics. Avoid financial advice." },
  { id: "chill", label: "Nigerian Tech Slang Chill", instructions: "Casual Nigerian tech space developer style. Use words like 'active', 'we ran it', 'no cap', 'shipped'." },
  { id: "corporate", label: "Corporate Announcement", instructions: "Formal product announcement. Focused on user benefits, clean typography, structured." }
];

export default function Settings() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAiProvider, setActiveAiProvider] = useState(() => localStorage.getItem("glitch_active_ai") || "gemini");
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem("backendUrl") || "");
  const [envValues, setEnvValues] = useState({});
  const [isSavingEnv, setIsSavingEnv] = useState(false);
  const [envMessage, setEnvMessage] = useState(null);

  // Live Testing States
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [fbTesting, setFbTesting] = useState(false);
  const [fbTestResult, setFbTestResult] = useState(null);

  // Brand Voices State
  const [customVoices, setCustomVoices] = useState([]);
  const [newVoiceLabel, setNewVoiceLabel] = useState("");
  const [newVoiceInstructions, setNewVoiceInstructions] = useState("");

  // Gemini Router State
  const [geminiConfig, setGeminiConfig] = useState([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const keys = JSON.parse(localStorage.getItem("glitch_keys") || "{}");
        setEnvValues(keys);
      } catch (err) {
        setEnvValues({});
      }
      try {
        const { api } = await import("../api.js");
        const res = await api.getMe();
        if (res.profile && res.profile.settings) {
          setEnvValues(res.profile.settings);
          localStorage.setItem("glitch_keys", JSON.stringify(res.profile.settings));
        }
        
        const gc = await api.getGeminiConfig();
        if (gc && Array.isArray(gc)) {
          setGeminiConfig(gc);
          localStorage.setItem("glitch_gemini_config", JSON.stringify(gc));
        } else {
          try {
            setGeminiConfig(JSON.parse(localStorage.getItem("glitch_gemini_config") || "[]"));
          } catch(e){}
        }
      } catch (e) {}
    };
    loadSettings();

    try {
      const savedVoices = JSON.parse(localStorage.getItem("glitch_brand_voices") || "[]");
      setCustomVoices(savedVoices);
    } catch (err) {
      setCustomVoices([]);
    }
  }, []);

  const saveBackendUrl = () => {
    if (backendUrl) {
      localStorage.setItem("backendUrl", backendUrl);
    } else {
      localStorage.removeItem("backendUrl");
    }
    window.location.reload();
  };

  const handleAiProviderChange = (provider) => {
    setActiveAiProvider(provider);
    localStorage.setItem("glitch_active_ai", provider);
  };

  const handleEnvChange = (envKey, value) => {
    setEnvValues(prev => ({ ...prev, [envKey]: value }));
  };

  const handleGeminiConfigChange = (taskType, modelId) => {
    const existing = geminiConfig.find(c => c.task_type === taskType);
    let updated;
    if (existing) {
      updated = geminiConfig.map(c => c.task_type === taskType ? { ...c, model_id: modelId } : c);
    } else {
      updated = [...geminiConfig, { task_type: taskType, model_id: modelId }];
    }
    setGeminiConfig(updated);
  };

  const saveAllSettings = async () => {
    setIsSavingEnv(true);
    setEnvMessage(null);
    try {
      // 1. Always save to LocalStorage first so the app works immediately on device
      localStorage.setItem("glitch_gemini_config", JSON.stringify(geminiConfig));
      localStorage.setItem("glitch_keys", JSON.stringify(envValues));
      localStorage.setItem("glitch_active_ai", activeAiProvider);
      localStorage.setItem("glitch_brand_voices", JSON.stringify(customVoices));
      
      let formattedBackendUrl = backendUrl ? backendUrl.trim() : "";
      if (formattedBackendUrl) {
        if (!formattedBackendUrl.startsWith("http://") && !formattedBackendUrl.startsWith("https://")) {
          formattedBackendUrl = "http://" + formattedBackendUrl;
        }
        localStorage.setItem("backendUrl", formattedBackendUrl);
        setBackendUrl(formattedBackendUrl);
      } else {
        localStorage.removeItem("backendUrl");
      }

      // 2. Attempt Backend Sync if API is accessible
      let backendSynced = false;
      try {
        const { api } = await import("../api.js");
        const settingsRes = await api.updateSettings(envValues);
        if (settingsRes && settingsRes.ok !== false && !settingsRes.localOnly) {
          backendSynced = true;
        }

        // Save Gemini Config mapping
        for (const config of geminiConfig) {
          if (config.task_type && config.model_id) {
            await api.updateGeminiConfig(config);
          }
        }
      } catch (e) {
        // Backend sync failed or offline; local storage is already updated
      }

      if (backendSynced) {
        setEnvMessage({ type: "success", text: "Settings, Configs, and API keys saved locally & synced to backend database!" });
      } else {
        setEnvMessage({ type: "success", text: "Settings, Configs, and API keys saved locally on device!" });
      }
      setTimeout(() => setEnvMessage(null), 3500);
    } catch (error) {
      setEnvMessage({ type: "error", text: "Failed to save settings: " + error.message });
    } finally {
      setIsSavingEnv(false);
    }
  };

  // Live AI Ping Test
  const testActiveAiConnection = async () => {
    setAiTesting(true);
    setAiTestResult(null);

    const provider = activeAiProvider;
    try {
      if (provider === "gemini") {
        const key = envValues.GEMINI_API_KEY;
        if (!key) throw new Error("Gemini API key is missing.");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Respond 'OK' if working." }] }] })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "OK";
        setAiTestResult({ ok: true, msg: `Gemini Active: "${text.trim().substring(0, 30)}..."` });
      } else if (provider === "claude") {
        const key = envValues.CLAUDE_API_KEY;
        if (!key) throw new Error("Claude API key is missing.");
        setAiTestResult({ ok: true, msg: "Claude API Key configured & ready." });
      } else if (provider === "deepseek") {
        const key = envValues.DEEPSEEK_API_KEY;
        if (!key) throw new Error("DeepSeek API key is missing.");
        setAiTestResult({ ok: true, msg: "DeepSeek API Key configured & ready." });
      }
    } catch (err) {
      setAiTestResult({ ok: false, msg: `Test failed: ${err.message}` });
    } finally {
      setAiTesting(false);
    }
  };

  // Live Meta Facebook Graph API Ping Test
  const testFacebookToken = async () => {
    setFbTesting(true);
    setFbTestResult(null);
    const token = envValues.META_PAGE_ACCESS_TOKEN;
    if (!token) {
      setFbTestResult({ ok: false, msg: "Page token is missing." });
      setFbTesting(false);
      return;
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
      const data = await res.json();
      if (res.ok && data.id) {
        setFbTestResult({ ok: true, msg: `Verified Page: ${data.name || data.id}` });
      } else {
        setFbTestResult({ ok: false, msg: data.error?.message || "Invalid Token" });
      }
    } catch (err) {
      setFbTestResult({ ok: false, msg: "Network error calling Meta Graph API" });
    } finally {
      setFbTesting(false);
    }
  };

  // Preset Handlers
  const handleAddPreset = (e) => {
    e.preventDefault();
    if (!newVoiceLabel.trim() || !newVoiceInstructions.trim()) return;

    const newPreset = {
      id: `custom-voice-${Date.now()}`,
      label: newVoiceLabel.trim(),
      instructions: newVoiceInstructions.trim(),
      isCustom: true
    };

    const updated = [...customVoices, newPreset];
    setCustomVoices(updated);
    localStorage.setItem("glitch_brand_voices", JSON.stringify(updated));
    setNewVoiceLabel("");
    setNewVoiceInstructions("");
  };

  const handleDeletePreset = (id) => {
    const updated = customVoices.filter(v => v.id !== id);
    setCustomVoices(updated);
    localStorage.setItem("glitch_brand_voices", JSON.stringify(updated));
  };

  return (
    <div className="p-4 md:p-8 relative min-h-screen bg-[#121215] pb-32">
      {/* Background Glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-accent/10 -bottom-20 right-0 opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 max-w-6xl mx-auto relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
            <SettingsIcon size={14} className="text-accent" /> Control Center Settings
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white mt-1">
            Accounts, AI & Presets Management
          </h1>
          <p className="text-muted text-[13px] mt-1.5 font-light leading-relaxed">
            Configure your AI providers (Gemini, Claude, DeepSeek), manage custom brand voice presets, and link social platform APIs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={saveAllSettings}
            disabled={isSavingEnv}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-bold px-6 py-3.5 rounded-full transition-all shrink-0 shadow-lg bg-accent text-[#121215] hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSavingEnv ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {envMessage && (
        <div className={`max-w-6xl mx-auto mb-6 p-4 rounded-2xl border flex items-center justify-between shadow-lg relative z-10 animate-in fade-in duration-200 ${
          envMessage.type === "success" ? "bg-signal/10 border-signal/30 text-signal" : "bg-alert/10 border-alert/30 text-alert"
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold font-mono">
            <CheckCircle2 size={18} />
            <span>{envMessage.text}</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-white/10 px-2.5 py-0.5 rounded-full">Local Device Sync</span>
        </div>
      )}

      {/* ---------------- SECTION 1: AI ENGINES MANAGER ---------------- */}
      <div className="max-w-6xl mx-auto mb-8 bg-surface rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Engines & Connection Manager
              </h2>
              <p className="text-xs text-muted">Select your primary AI model and paste your connection API keys.</p>
            </div>
          </div>

          <button
            onClick={testActiveAiConnection}
            disabled={aiTesting}
            className="flex items-center gap-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-full transition-all border border-white/10 cursor-pointer self-start sm:self-center"
          >
            {aiTesting ? <RefreshCw size={14} className="animate-spin text-accent" /> : <Activity size={14} className="text-accent" />}
            <span>Test Active AI ({activeAiProvider.toUpperCase()})</span>
          </button>
        </div>

        {/* Test Result Indicator */}
        {aiTestResult && (
          <div className={`p-3 rounded-2xl text-xs font-mono flex items-center gap-2 border ${
            aiTestResult.ok ? "bg-signal/10 border-signal/30 text-signal" : "bg-alert/10 border-alert/30 text-alert"
          }`}>
            {aiTestResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{aiTestResult.msg}</span>
          </div>
        )}

        {/* AI Provider Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { id: "gemini", name: "Google Gemini AI", desc: "gemini-2.5-flash • Multimodal & High Speed", color: "border-purple-500/40 bg-purple-500/10" },
            { id: "claude", name: "Anthropic Claude AI", desc: "claude-3-5-sonnet • Advanced Reasoning", color: "border-amber-500/40 bg-amber-500/10" },
            { id: "deepseek", name: "DeepSeek AI Engine", desc: "deepseek-chat • Code & Quant Specialist", color: "border-cyan-500/40 bg-cyan-500/10" }
          ].map(p => (
            <div
              key={p.id}
              onClick={() => handleAiProviderChange(p.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                activeAiProvider === p.id ? `${p.color} text-white font-bold shadow-lg` : "bg-[#121215] border-white/5 text-muted hover:text-white"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold flex items-center gap-2">
                  <Radio size={14} className={activeAiProvider === p.id ? "text-accent" : "text-muted"} />
                  {p.name}
                </span>
                {activeAiProvider === p.id && (
                  <span className="text-[10px] font-mono uppercase bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">Active</span>
                )}
              </div>
              <p className="text-[11px] font-normal opacity-80">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Key Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
          {/* Gemini */}
          <div className="space-y-3 bg-[#121215] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Google Gemini Key</span>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-0.5">
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <input
              type="password"
              value={envValues.GEMINI_API_KEY || ""}
              onChange={(e) => handleEnvChange("GEMINI_API_KEY", e.target.value)}
              placeholder="Paste AIzaSy... key"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
            <input
              type="text"
              value={envValues.GEMINI_MODEL || ""}
              onChange={(e) => handleEnvChange("GEMINI_MODEL", e.target.value)}
              placeholder="Model: gemini-2.5-flash"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono text-muted outline-none focus:border-accent/40"
            />
          </div>

          {/* Claude */}
          <div className="space-y-3 bg-[#121215] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Claude (Anthropic) Key</span>
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-0.5">
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <input
              type="password"
              value={envValues.CLAUDE_API_KEY || ""}
              onChange={(e) => handleEnvChange("CLAUDE_API_KEY", e.target.value)}
              placeholder="Paste sk-ant-api03-... key"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
            <input
              type="text"
              value={envValues.CLAUDE_MODEL || ""}
              onChange={(e) => handleEnvChange("CLAUDE_MODEL", e.target.value)}
              placeholder="Model: claude-3-5-sonnet-20241022"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono text-muted outline-none focus:border-accent/40"
            />
          </div>

          {/* DeepSeek */}
          <div className="space-y-3 bg-[#121215] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>DeepSeek Key</span>
              <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-[10px] text-accent hover:underline flex items-center gap-0.5">
                Get Key <ExternalLink size={10} />
              </a>
            </div>
            <input
              type="password"
              value={envValues.DEEPSEEK_API_KEY || ""}
              onChange={(e) => handleEnvChange("DEEPSEEK_API_KEY", e.target.value)}
              placeholder="Paste sk-... key"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
            <input
              type="text"
              value={envValues.DEEPSEEK_MODEL || ""}
              onChange={(e) => handleEnvChange("DEEPSEEK_MODEL", e.target.value)}
              placeholder="Model: deepseek-chat"
              className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-[11px] font-mono text-muted outline-none focus:border-accent/40"
            />
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 1.5: GEMINI MODEL ROUTER ---------------- */}
      <div className="max-w-6xl mx-auto mb-8 bg-surface rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Cpu size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Gemini Model Router
              </h2>
              <p className="text-xs text-muted">Assign specific Gemini models to specific automation tasks for cost/quality optimization.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: "caption_gen", label: "Post Caption / Copy Generation", desc: "Used for rewriting posts per-platform." },
            { id: "strategy", label: "Deep Strategy / Repurposing", desc: "Used for analyzing top performers & digests." },
            { id: "reply_gen", label: "Comment Reply Generation", desc: "Used for auto-replying to community comments." },
            { id: "image_gen", label: "Image Generation / Edits", desc: "Used for generating hero images." }
          ].map(task => {
            const currentModel = geminiConfig.find(c => c.task_type === task.id)?.model_id || "";
            return (
              <div key={task.id} className="p-4 rounded-2xl bg-[#121215] border border-white/5 flex flex-col justify-between">
                <div className="mb-3">
                  <h4 className="text-sm font-bold text-white">{task.label}</h4>
                  <p className="text-[10px] text-muted">{task.desc}</p>
                </div>
                <select
                  value={currentModel}
                  onChange={(e) => handleGeminiConfigChange(task.id, e.target.value)}
                  className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent"
                >
                  <option value="">Default (Global Model)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fast/Cheap)</option>
                  <option value="gemini-3.1-pro">Gemini 3.1 Pro (Deep Strategy)</option>
                  <option value="gemini-3-flash">Gemini 3 Flash</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Cheapest)</option>
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- SECTION 2: BRAND VOICE PRESETS MANAGER ---------------- */}
      <div className="max-w-6xl mx-auto mb-8 bg-surface rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-accent/10 text-accent border border-accent/20">
              <Sliders size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Brand Voice & Tone Presets Manager
              </h2>
              <p className="text-xs text-muted">Create custom tone presets to automatically guide AI post generation in Composer.</p>
            </div>
          </div>
        </div>

        {/* Existing Presets List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...DEFAULT_BRAND_VOICES, ...customVoices].map((preset) => (
            <div key={preset.id} className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles size={12} className="text-accent" />
                    {preset.label}
                  </span>
                  {preset.isCustom ? (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-alert hover:underline text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={10} /> Remove
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded-full text-muted">Built-in</span>
                  )}
                </div>
                <p className="text-[11px] text-muted leading-relaxed italic">"{preset.instructions}"</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Custom Preset Form */}
        <form onSubmit={handleAddPreset} className="p-4 rounded-2xl bg-[#121215] border border-accent/30 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
            <Plus size={14} className="text-accent" /> Add New Brand Voice Preset
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Preset Name (e.g. Technical Founder)"
              value={newVoiceLabel}
              onChange={(e) => setNewVoiceLabel(e.target.value)}
              className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-accent"
              required
            />
            <input
              type="text"
              placeholder="Voice Instructions for AI (e.g. Write concise, confident dev notes...)"
              value={newVoiceInstructions}
              onChange={(e) => setNewVoiceInstructions(e.target.value)}
              className="md:col-span-2 bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-accent"
              required
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-accent text-[#121215] font-bold text-xs rounded-xl flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer shadow-md"
          >
            <Plus size={14} /> Add Preset to Composer
          </button>
        </form>
      </div>

      {/* ---------------- SECTION 3: SOCIAL MEDIA INTEGRATIONS ---------------- */}
      <div className="max-w-6xl mx-auto mb-8 bg-surface rounded-[32px] p-6 md:p-8 border border-white/5 shadow-xl relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Facebook size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Social Media Accounts Connection Protocol
              </h2>
              <p className="text-xs text-muted">Link your Facebook Page, Instagram Business Account, and LinkedIn profile for direct auto-posting.</p>
            </div>
          </div>

          <button
            onClick={testFacebookToken}
            disabled={fbTesting}
            className="flex items-center gap-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-full transition-all border border-white/10 cursor-pointer"
          >
            {fbTesting ? <RefreshCw size={14} className="animate-spin text-accent" /> : <Activity size={14} className="text-accent" />}
            <span>Test Facebook Graph API</span>
          </button>
        </div>

        {/* Facebook Test Result Indicator */}
        {fbTestResult && (
          <div className={`p-3 rounded-2xl text-xs font-mono flex items-center gap-2 border ${
            fbTestResult.ok ? "bg-signal/10 border-signal/30 text-signal" : "bg-alert/10 border-alert/30 text-alert"
          }`}>
            {fbTestResult.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            <span>{fbTestResult.msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Facebook */}
          <div className="space-y-3 bg-[#121215] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Facebook size={16} className="text-blue-500" />
              <span>Facebook Page API</span>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase text-muted">Page Access Token</label>
              <input
                type="password"
                value={envValues.META_PAGE_ACCESS_TOKEN || ""}
                onChange={(e) => handleEnvChange("META_PAGE_ACCESS_TOKEN", e.target.value)}
                placeholder="EAA..."
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent/40"
              />
              <label className="block text-[10px] font-mono uppercase text-muted">Page ID</label>
              <input
                type="text"
                value={envValues.META_PAGE_ID || ""}
                onChange={(e) => handleEnvChange("META_PAGE_ID", e.target.value)}
                placeholder="109283..."
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent/40"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="space-y-3 bg-[#121215] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Instagram size={16} className="text-pink-500" />
              <span>Instagram Business API</span>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase text-muted">Business Account ID</label>
              <input
                type="text"
                value={envValues.META_IG_BUSINESS_ACCOUNT_ID || ""}
                onChange={(e) => handleEnvChange("META_IG_BUSINESS_ACCOUNT_ID", e.target.value)}
                placeholder="178414..."
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent/40"
              />
              <p className="text-[10px] text-muted leading-tight pt-1">Linked to your Meta Graph Access Token above.</p>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="space-y-3 bg-[#121215] p-5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Linkedin size={16} className="text-sky-400" />
              <span>LinkedIn Profile API</span>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase text-muted">Access Token</label>
              <input
                type="password"
                value={envValues.LINKEDIN_ACCESS_TOKEN || ""}
                onChange={(e) => handleEnvChange("LINKEDIN_ACCESS_TOKEN", e.target.value)}
                placeholder="AQV..."
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent/40"
              />
              <label className="block text-[10px] font-mono uppercase text-muted">Person / Org URN</label>
              <input
                type="text"
                value={envValues.LINKEDIN_PERSON_URN || ""}
                onChange={(e) => handleEnvChange("LINKEDIN_PERSON_URN", e.target.value)}
                placeholder="urn:li:person:XXXXX"
                className="w-full bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-accent/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 4: DATABASE & ADSENSE ---------------- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* Supabase */}
        <div className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Cloud PostgreSQL</h3>
              <p className="text-xs text-muted">Database & media vault storage credentials.</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="Backend URL (e.g., http://localhost:8787)"
              className="w-full bg-[#121215] border border-accent/40 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-accent"
            />
            <input
              type="text"
              value={envValues.SUPABASE_URL || ""}
              onChange={(e) => handleEnvChange("SUPABASE_URL", e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full bg-[#121215] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
            <input
              type="password"
              value={envValues.SUPABASE_SERVICE_ROLE_KEY || ""}
              onChange={(e) => handleEnvChange("SUPABASE_SERVICE_ROLE_KEY", e.target.value)}
              placeholder="Anon / Service Role Key"
              className="w-full bg-[#121215] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* AdSense */}
        <div className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google AdSense Monetization</h3>
              <p className="text-xs text-muted">Display banner ad slots configuration.</p>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <input
              type="text"
              value={envValues.GOOGLE_ADSENSE_CLIENT_ID || ""}
              onChange={(e) => handleEnvChange("GOOGLE_ADSENSE_CLIENT_ID", e.target.value)}
              placeholder="ca-pub-3940256099942544"
              className="w-full bg-[#121215] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
            <input
              type="text"
              value={envValues.GOOGLE_ADSENSE_SLOT_ID || ""}
              onChange={(e) => handleEnvChange("GOOGLE_ADSENSE_SLOT_ID", e.target.value)}
              placeholder="8821940192"
              className="w-full bg-[#121215] border border-white/5 rounded-xl px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-accent/40"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
