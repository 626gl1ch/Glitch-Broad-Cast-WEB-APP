import React, { useState, useEffect } from "react";
import { 
  Wand2, 
  Send, 
  Clock, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Users, 
  Sparkles,
  RefreshCw,
  Plus,
  Paperclip,
  CheckCircle2,
  CheckSquare,
  Square,
  MessageSquareCode,
  Settings as SettingsIcon
} from "lucide-react";
import { api } from "../api";

const PLATFORMS = [
  { id: "facebook_page", label: "FB Page", icon: Facebook, maxChar: 5000, desc: "Conversational, engaging" },
  { id: "instagram", label: "Instagram", icon: Instagram, maxChar: 2200, desc: "Punchy, emoji-rich, hashtags" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, maxChar: 3000, desc: "Professional, structured" },
  { id: "facebook_group", label: "FB Groups", icon: Users, maxChar: 5000, desc: "Community cross-posting" },
];

const BRAND_VOICES = [
  { id: "dev", label: "Solo Dev / Build in Public", instructions: "Nigerian solo developer showing technical progress, clean engineering, no fluff, no fake hype. Use simple language." },
  { id: "trading", label: "Algo Trader Spec", instructions: "Quantitative trader discussing backtests, risk parameters, pine scripts, statistics. Avoid financial advice." },
  { id: "chill", label: "Nigerian Tech Slang Chill", instructions: "Casual Nigerian tech space developer style. Use words like 'active', 'we ran it', 'no cap', 'shipped'." },
  { id: "corporate", label: "Corporate Announcement", instructions: "Formal product announcement. Focused on user benefits, clean typography, structured." }
];

export default function Composer() {
  const [baseContent, setBaseContent] = useState(() => localStorage.getItem("glitch_composer_draft") || "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["linkedin", "facebook_page", "facebook_group"]);
  const [brandVoice, setBrandVoice] = useState("dev");
  const [attachedImage, setAttachedImage] = useState(null);
  
  // Facebook Group Multi-Select State
  const [storedGroups, setStoredGroups] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [variants, setVariants] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [schedulingPostId, setSchedulingPostId] = useState(null);
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    // Clear draft once loaded
    if (localStorage.getItem("glitch_composer_draft")) {
      localStorage.removeItem("glitch_composer_draft");
    }

    const saved = localStorage.getItem("glitch_fb_groups");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStoredGroups(parsed);
        setSelectedGroupIds(parsed.map(g => g.id));
      } catch (e) {}
    }
  }, []);

  const togglePlatform = (id) => {
    setSelectedPlatforms((s) => 
      s.includes(id) ? s.filter((p) => p !== id) : [...s, id]
    );
  };

  const toggleGroupSelect = (id) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const selectAllGroups = () => {
    if (selectedGroupIds.length === storedGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(storedGroups.map(g => g.id));
    }
  };

  const generate = async () => {
    if (!baseContent.trim() || selectedPlatforms.length === 0) return;
    setGenerating(true);
    
    const selectedVoice = BRAND_VOICES.find(v => v.id === brandVoice)?.instructions || "";
    
    try {
      const result = await api.generateVariants({
        baseContent,
        platforms: selectedPlatforms,
        brandVoiceNotes: selectedVoice
      });
      setVariants(result.variants || []);
    } catch (err) {
      console.warn("Using fallback generator:", err.message);
      const mockVariants = selectedPlatforms.map((p) => ({
        id: `v-${p}-${Date.now()}`,
        platform: p,
        content: baseContent + `\n\nAutomated via Glitch Broadcast.`,
        hashtags: ["glitch", "automation", "tech"],
        created_at: new Date().toISOString()
      }));
      setVariants(mockVariants);
    } finally {
      setGenerating(false);
    }
  };

  const updateVariantText = (id, content) => {
    setVariants((vs) => vs.map((v) => (v.id === id ? { ...v, content } : v)));
  };

  const logActivity = (type, platform, text) => {
    try {
      const log = JSON.parse(localStorage.getItem("glitch_activity_log") || "[]");
      log.unshift({
        id: `act-${Date.now()}`,
        type,
        platform,
        text,
        time: new Date().toISOString()
      });
      localStorage.setItem("glitch_activity_log", JSON.stringify(log.slice(0, 50)));
    } catch (e) {}
  };

  const publish = async (variant) => {
    try {
      if (variant.platform === "facebook_group") {
        const targetGroups = storedGroups.filter(g => selectedGroupIds.includes(g.id));
        if (targetGroups.length === 0) {
          return alert("Please select at least 1 Facebook Group target below.");
        }

        const newQueueItems = targetGroups.map(g => ({
          id: `q-${Date.now()}-${g.id}`,
          group_url: g.url,
          group_name: g.name,
          status: "queued",
          created_at: new Date().toISOString(),
          post_variants: {
            content: variant.content
          }
        }));

        const existingQueue = JSON.parse(localStorage.getItem("glitch_group_queue") || "[]");
        const updatedQueue = [...newQueueItems, ...existingQueue];
        localStorage.setItem("glitch_group_queue", JSON.stringify(updatedQueue));

        logActivity("publish", "facebook_group", `Queued across ${targetGroups.length} FB Groups: "${variant.content.substring(0,40)}..."`);
        alert(`Successfully queued post across ${targetGroups.length} Facebook Groups! Navigating to Groups tab to execute.`);
        window.dispatchEvent(new CustomEvent('nav-change', { detail: 'groups' }));
      } else {
        await api.publishVariant(variant.id, attachedImage?.url);
        logActivity("publish", variant.platform, `Published: "${variant.content.substring(0,50)}..."`);
        alert(`Successfully published to ${variant.platform}!`);
      }
    } catch (err) {
      alert(`Publish status: ${err.message}`);
    }
  };

  const handleScheduleSubmit = async (variant) => {
    if (!scheduleDate) return alert("Select a date and time first.");
    try {
      const scheduledItem = {
        id: `sch-${Date.now()}`,
        scheduled_for: new Date(scheduleDate).toISOString(),
        content: variant.content,
        base_content: baseContent,
        platform: variant.platform,
        created_at: new Date().toISOString()
      };

      const existingScheduled = JSON.parse(localStorage.getItem("glitch_scheduled_posts") || "[]");
      const updatedScheduled = [scheduledItem, ...existingScheduled];
      localStorage.setItem("glitch_scheduled_posts", JSON.stringify(updatedScheduled));

      logActivity("schedule", variant.platform, `Scheduled for ${new Date(scheduleDate).toLocaleString()}: "${variant.content.substring(0,40)}..."`);
      alert(`Successfully scheduled for ${new Date(scheduleDate).toLocaleString()}!`);
      setSchedulingPostId(null);
      setScheduleDate("");
    } catch (err) {
      alert(err.message);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await api.uploadFile(file, "uploads");
      setAttachedImage({
        name: result.name,
        url: result.file_url
      });
    } catch (err) {
      alert(`Upload notice: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#121215] pb-32">
      <div className="glow-blob w-[500px] h-[500px] bg-accent/10 -top-10 left-1/4 opacity-60 pointer-events-none" />

      <div className="relative p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Title Header */}
        <div className="flex justify-between items-center bg-surface/50 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
              <Wand2 size={14} /> AI Content Engine
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-1">
              Multi-Platform Composer
            </h1>
          </div>
        </div>

        {/* Split Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left panel (Inputs) */}
          <div className="space-y-6">
            <div className="bg-surface rounded-[32px] p-6 shadow-2xl border border-white/5 space-y-6">
              
              {/* Input Area */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white">Source Material / Core Post Idea</label>
                <textarea
                  value={baseContent}
                  onChange={(e) => setBaseContent(e.target.value)}
                  placeholder="Paste your updates, announcements, or thoughts here..."
                  rows={6}
                  className="w-full bg-[#121215] rounded-[24px] px-5 py-4 text-[14px] text-white placeholder:text-muted outline-none resize-none focus:border-accent/50 border border-transparent transition-all shadow-inner"
                />
              </div>

              {/* Brand Voice Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white">Brand Voice Preset</label>
                <select
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  className="w-full bg-[#121215] rounded-[20px] px-4 py-4 text-[13px] text-white outline-none focus:border-accent/50 border border-transparent transition-all cursor-pointer shadow-inner font-sans"
                >
                  {BRAND_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Platform Targets */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white">Target Channels</label>
                <div className="grid grid-cols-2 gap-3">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-3 p-3.5 rounded-[20px] border text-left transition-all duration-300 cursor-pointer ${
                          active
                            ? "border-accent bg-accent/10 text-white shadow-[0_0_15px_rgba(176,139,255,0.15)] font-semibold"
                            : "border-white/5 bg-[#121215] text-muted hover:border-white/10 hover:text-white"
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition-all ${active ? "bg-accent text-[#121215]" : "bg-white/[0.04] text-muted"}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{p.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Facebook Groups Target Selector (Infinite Groups selection) */}
              {selectedPlatforms.includes("facebook_group") && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Users size={14} className="text-accent" /> Selected FB Groups ({selectedGroupIds.length})
                    </label>
                    <button
                      type="button"
                      onClick={selectAllGroups}
                      className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedGroupIds.length === storedGroups.length ? <CheckSquare size={12} /> : <Square size={12} />}
                      Select All ({storedGroups.length})
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-2 p-2 bg-[#121215] rounded-2xl border border-white/5">
                    {storedGroups.map((g) => {
                      const isChecked = selectedGroupIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGroupSelect(g.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                            isChecked ? "bg-accent/10 border-accent/30 text-white font-medium" : "bg-surface/30 border-transparent text-muted hover:text-white"
                          }`}
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="font-semibold">{g.name}</span>
                            <span className="text-[10px] font-mono text-muted block truncate">{g.url}</span>
                          </div>
                          {isChecked && <CheckCircle2 size={16} className="text-accent shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Media Attachment */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-xs font-semibold text-white flex items-center justify-between">
                  <span>Vault Attachment</span>
                  {attachedImage && (
                    <button 
                      onClick={() => setAttachedImage(null)}
                      className="text-alert hover:underline text-[10px] font-mono uppercase tracking-widest cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </label>
                {attachedImage ? (
                  <div className="flex items-center gap-3 p-3 rounded-[20px] bg-white/[0.02] border border-white/5 text-xs text-white shadow-inner">
                    <img src={attachedImage.url} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="truncate flex-1 font-mono text-[11px]">{attachedImage.name}</span>
                    <CheckCircle2 size={16} className="text-signal" />
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[20px] border border-dashed border-white/10 hover:border-accent hover:bg-accent/5 hover:text-white bg-[#121215] text-muted text-xs font-medium transition-all cursor-pointer shadow-inner">
                    {isUploading ? <RefreshCw size={16} className="animate-spin" /> : <Paperclip size={16} />}
                    <span>{isUploading ? "Uploading..." : "Attach Image / Media"}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" disabled={isUploading} />
                  </label>
                )}
              </div>

            </div>
          </div>

          {/* Right panel (Variants Stack) */}
          <div className="space-y-6 pb-24">
            {variants.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Tailored Previews</h3>
                  <span className="text-xs text-muted">Review and deploy</span>
                </div>

                {variants.map((v) => {
                  const platMeta = PLATFORMS.find((p) => p.id === v.platform) || { label: "Platform", icon: Users, maxChar: 3000 };
                  const Icon = platMeta.icon;

                  return (
                    <div key={v.platform} className="bg-surface rounded-[32px] p-6 space-y-5 shadow-xl border border-white/5">
                      
                      {/* Platform header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-white/[0.04] text-white">
                            <Icon size={18} />
                          </div>
                          <span className="text-sm font-bold text-white">{platMeta.label}</span>
                        </div>
                      </div>

                      {/* Variant textarea */}
                      <textarea
                        value={v.content}
                        onChange={(e) => updateVariantText(v.id, e.target.value)}
                        rows={5}
                        className="w-full bg-[#121215] border border-transparent rounded-[24px] px-5 py-4 text-[13px] leading-relaxed text-white outline-none focus:border-accent/50 shadow-inner transition-all resize-none font-sans"
                      />

                      {/* Hashtags block */}
                      {v.hashtags && v.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {v.hashtags.map((tag) => (
                            <span key={tag} className="text-xs font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Scheduling Form Block */}
                      {schedulingPostId === v.id && (
                        <div className="p-4 rounded-2xl bg-[#121215] border border-accent/30 space-y-3 animate-in fade-in">
                          <label className="block text-xs font-bold text-white font-mono uppercase">Select Date & Time</label>
                          <input
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-accent font-mono"
                          />
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              onClick={() => setSchedulingPostId(null)}
                              className="px-3 py-1.5 text-xs text-muted hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleScheduleSubmit(v)}
                              className="px-4 py-1.5 bg-accent text-[#121215] font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Save Schedule
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Operations tray */}
                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                        <button
                          onClick={() => setSchedulingPostId(v.id)}
                          className="flex items-center gap-2 text-xs font-bold text-muted hover:text-white transition-colors p-2 cursor-pointer"
                        >
                          <Clock size={16} /> Schedule
                        </button>

                        <button
                          onClick={() => publish(v)}
                          className="flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-3 rounded-full transition-all cursor-pointer"
                        >
                          {v.platform === "facebook_group" ? (
                            <>
                              <Plus size={16} /> Queue Selected Groups ({selectedGroupIds.length})
                            </>
                          ) : (
                            <>
                              <Send size={16} /> Publish Post
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center border border-dashed border-white/5 rounded-[32px] bg-surface/50">
                <MessageSquareCode size={48} className="text-muted mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-white tracking-wide">Waiting for inputs</h3>
                <p className="text-sm text-muted max-w-sm mt-2 leading-relaxed">
                  Enter your post details on the left and click Generate to create tailored variations.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Docked Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#121215] to-transparent pointer-events-none flex justify-center z-40">
        <button
          onClick={generate}
          disabled={generating || !baseContent.trim() || selectedPlatforms.length === 0}
          className="pointer-events-auto w-full max-w-md h-[68px] rounded-full bg-accent text-[#121215] font-bold text-base shadow-[0_10px_30px_rgba(176,139,255,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
        >
          {generating ? (
            <>
              <RefreshCw size={22} className="animate-spin" /> Generating Variations...
            </>
          ) : (
            <>
              <Sparkles size={22} /> Generate Multi-Platform Content
            </>
          )}
        </button>
      </div>

    </div>
  );
}
