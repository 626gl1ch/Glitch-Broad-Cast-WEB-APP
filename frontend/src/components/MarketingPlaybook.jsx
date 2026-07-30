import React, { useState, useEffect } from "react";
import { 
  Rocket, 
  Video, 
  Sparkles, 
  TrendingUp,
  Settings,
  Megaphone,
  Check,
  ChevronRight,
  List,
  AlertCircle
} from "lucide-react";
import api from "../api";

export default function MarketingPlaybook() {
  const [activeTab, setActiveTab] = useState("broadcast");
  const [campaigns, setCampaigns] = useState([]);
  
  // Broadcast Form State
  const [campName, setCampName] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [tone, setTone] = useState("Professional");
  const [platforms, setPlatforms] = useState({ facebook_page: true, facebook_group: false, instagram: true, linkedin: true });
  const [variantsCount, setVariantsCount] = useState(3);
  const [schedule, setSchedule] = useState("daily");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Sub-tools
  const [videoDesc, setVideoDesc] = useState("");
  const [videoIdeas, setVideoIdeas] = useState([]);
  const [isGenVideo, setIsGenVideo] = useState(false);
  
  const [hookTopic, setHookTopic] = useState("");
  const [hooks, setHooks] = useState([]);
  const [isGenHooks, setIsGenHooks] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const data = await api.fetchCampaigns();
    if (Array.isArray(data)) setCampaigns(data);
  };

  const togglePlatform = (p) => setPlatforms(prev => ({...prev, [p]: !prev[p]}));

  const handleBroadcast = async () => {
    if (!campName || !campDesc) return;
    const selectedPlatforms = Object.keys(platforms).filter(k => platforms[k]);
    if (!selectedPlatforms.length) return;

    setIsGenerating(true);
    setFeedbackMsg("AI is analyzing massive text chunk by chunk... (this can take up to 60 seconds)");
    
    const res = await api.createCampaign(campName, campDesc, selectedPlatforms, tone, schedule, variantsCount);
    
    if (res?.ok === false) {
      setFeedbackMsg(`Error: ${res.error}`);
    } else {
      setFeedbackMsg("Campaign generated successfully! Posts are now in the Scheduler.");
      setCampName(""); setCampDesc("");
      loadCampaigns();
    }
    setIsGenerating(false);
  };

  const handleGenVideo = async () => {
    if (!videoDesc) return;
    setIsGenVideo(true);
    const res = await api.generateVideoIdeas(videoDesc);
    if (Array.isArray(res)) setVideoIdeas(res);
    setIsGenVideo(false);
  };

  const handleGenHooks = async () => {
    if (!hookTopic) return;
    setIsGenHooks(true);
    const res = await api.generateHooks(hookTopic);
    if (Array.isArray(res)) setHooks(res);
    setIsGenHooks(false);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#121215] p-4 md:p-8 relative pb-32">
      {/* Ambient Glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-accent/10 top-0 left-1/4 opacity-40 pointer-events-none" />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
            <Megaphone size={14} /> AI Product Broadcast Studio
          </div>
          <h1 className="font-display text-3xl font-bold text-white mt-1">
            The Content Engine
          </h1>
          <p className="text-xs text-muted mt-1 font-medium leading-relaxed max-w-2xl">
            Paste up to 1 million+ words of product specs, manuals, or ideas. The AI will chunk it, summarize it, and generate a massive recurring campaign across all your connected socials automatically.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center gap-2 overflow-x-auto scrollbar-none relative z-10">
        {[
          { id: "broadcast", label: "Broadcast Studio", icon: Rocket },
          { id: "video", label: "Video Idea Engine", icon: Video },
          { id: "hooks", label: "Trending Hooks", icon: TrendingUp },
          { id: "campaigns", label: "Campaign Manager", icon: List },
          { id: "brand", label: "Brand Voice", icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id ? "bg-accent text-[#121215] shadow-md" : "bg-surface text-muted hover:text-white border border-white/5"
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- BROADCAST STUDIO TAB --- */}
        {activeTab === "broadcast" && (
          <div className="bg-surface border border-white/5 p-6 rounded-[24px] shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Input */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-bold text-white mb-2 block uppercase tracking-wider">Campaign Name</label>
                  <input 
                    type="text" 
                    value={campName} onChange={e => setCampName(e.target.value)}
                    placeholder="e.g., Summer Sneaker Launch 2026"
                    className="w-full bg-[#121215] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-colors"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Massive Product Description (1M+ Words limit)</label>
                    <span className="text-xs text-muted font-mono">{campDesc.length} chars</span>
                  </div>
                  <textarea 
                    value={campDesc} onChange={e => setCampDesc(e.target.value)}
                    placeholder="Paste entire PDFs, product manuals, blog posts, transcripts here... The AI will chunk it and process it."
                    className="w-full bg-[#121215] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-accent outline-none transition-colors h-64 resize-y"
                  />
                </div>
              </div>

              {/* Right Column: Settings */}
              <div className="space-y-6 bg-[#121215] p-5 rounded-2xl border border-white/5">
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider mb-3 block">Platforms</label>
                  <div className="space-y-2">
                    {Object.keys(platforms).map(p => (
                      <label key={p} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${platforms[p] ? 'bg-accent border-accent' : 'border-white/20 group-hover:border-white/50'}`}>
                          {platforms[p] && <Check size={14} className="text-[#121215]" />}
                        </div>
                        <span className="text-sm font-medium text-white/80">{p.replace('_', ' ').toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">Campaign Tone</label>
                  <select 
                    value={tone} onChange={e => setTone(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none"
                  >
                    <option>Professional</option>
                    <option>Viral / Hype</option>
                    <option>Storytelling</option>
                    <option>Educational</option>
                    <option>Controversial / Edgy</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider mb-2 block">Frequency & Volume</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={schedule} onChange={e => setSchedule(e.target.value)}
                      className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none"
                    >
                      <option value="daily">Daily Posts</option>
                      <option value="weekly">Weekly Posts</option>
                    </select>
                    <select 
                      value={variantsCount} onChange={e => setVariantsCount(parseInt(e.target.value))}
                      className="w-full bg-surface border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none"
                    >
                      <option value={1}>1 Variant</option>
                      <option value={3}>3 Variants</option>
                      <option value={5}>5 Variants</option>
                      <option value={10}>10 Variants</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className={`text-xs font-mono flex items-center gap-2 ${feedbackMsg.includes('Error') ? 'text-red-400' : 'text-accent'}`}>
                {isGenerating && <Sparkles size={14} className="animate-spin" />}
                {feedbackMsg}
              </p>
              <button
                onClick={handleBroadcast}
                disabled={isGenerating || !campDesc}
                className="w-full sm:w-auto px-8 py-3.5 bg-accent text-[#121215] font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGenerating ? "Analyzing 1M+ Words..." : "Generate & Broadcast"}
                {!isGenerating && <Rocket size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* --- VIDEO IDEAS TAB --- */}
        {activeTab === "video" && (
          <div className="bg-surface border border-white/5 p-6 rounded-[24px] shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Video className="text-red-400" /> Viral Short-Form Idea Engine</h2>
            <textarea 
              value={videoDesc} onChange={e => setVideoDesc(e.target.value)}
              placeholder="Paste product description, features, or link..."
              className="w-full bg-[#121215] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-red-400 outline-none h-32"
            />
            <button
              onClick={handleGenVideo} disabled={isGenVideo}
              className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-500/30 transition-all"
            >
              {isGenVideo ? "Generating..." : "Generate Video Ideas"}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {videoIdeas.map((idea, i) => (
                <div key={i} className="bg-[#121215] p-5 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-[10px] font-mono text-red-400 uppercase bg-red-400/10 px-2 py-1 rounded">{idea.platform_fit}</span>
                  <p className="text-sm text-white font-bold">"{idea.hook}"</p>
                  <p className="text-xs text-muted leading-relaxed">{idea.outline}</p>
                  <p className="text-xs text-blue-400">{idea.hashtags?.join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- HOOKS TAB --- */}
        {activeTab === "hooks" && (
          <div className="bg-surface border border-white/5 p-6 rounded-[24px] shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><TrendingUp className="text-emerald-400" /> Trending Hook Generator</h2>
            <input 
              type="text" value={hookTopic} onChange={e => setHookTopic(e.target.value)}
              placeholder="Topic (e.g. Remote work setups, quant trading, vegan diets)..."
              className="w-full bg-[#121215] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-emerald-400 outline-none"
            />
            <button
              onClick={handleGenHooks} disabled={isGenHooks}
              className="px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500/30 transition-all"
            >
              {isGenHooks ? "Analyzing trends..." : "Generate 10 Hooks"}
            </button>

            <div className="space-y-3 mt-6">
              {hooks.map((h, i) => (
                <div key={i} className="bg-[#121215] p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 group hover:border-emerald-500/30 transition-colors">
                  <p className="text-sm text-white font-medium">{h.hook}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${h.estimated_engagement === 'High' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-muted'}`}>
                    {h.estimated_engagement} Potential
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CAMPAIGN MANAGER TAB --- */}
        {activeTab === "campaigns" && (
          <div className="bg-surface border border-white/5 p-6 rounded-[24px] shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><List className="text-sky-400" /> Active Campaigns</h2>
            {campaigns.length === 0 ? (
              <p className="text-xs text-muted">No campaigns generated yet. Go to Broadcast Studio.</p>
            ) : (
              campaigns.map(c => (
                <div key={c.id} className="bg-[#121215] p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-white">{c.name}</h3>
                    <p className="text-xs text-muted mt-1">{c.posts?.length || 0} Parent Posts generated • Tone: {c.tone}</p>
                    <div className="flex gap-2 mt-2">
                      {c.platforms.map(p => <span key={p} className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded">{p}</span>)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-muted'}`}>
                    {c.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- BRAND VOICE TAB --- */}
        {activeTab === "brand" && (
          <div className="bg-surface border border-white/5 p-6 rounded-[24px] shadow-xl flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <AlertCircle size={48} className="mx-auto text-muted/30" />
              <h2 className="text-xl font-bold text-white">Brand Memory Vault</h2>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Global brand voice configuration is currently managed via `AGENTS.md` and `Settings.jsx`. Advanced UI configuration arriving in v2.1.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
