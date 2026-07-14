import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Clock, 
  Settings as SettingsIcon, 
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Users,
  Send,
  Eye,
  BarChart3,
  ThumbsUp,
  Share2,
  Filter,
  Inbox,
  AlertCircle,
  Activity,
  BookOpen
} from "lucide-react";

// Track real actions in localStorage
const getStats = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_stats") || "{}");
  } catch { return {}; }
};

const getActivityLog = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_activity_log") || "[]");
  } catch { return []; }
};

const getComments = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_social_comments") || "[]");
  } catch { return []; }
};

const getScheduled = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_scheduled_posts") || "[]");
  } catch { return []; }
};

const getGroupQueue = () => {
  try {
    return JSON.parse(localStorage.getItem("glitch_group_queue") || "[]");
  } catch { return []; }
};

const platformIcon = (platform) => {
  if (platform === "facebook_page") return <Facebook size={14} className="text-blue-400" />;
  if (platform === "instagram") return <Instagram size={14} className="text-pink-400" />;
  if (platform === "linkedin") return <Linkedin size={14} className="text-sky-400" />;
  if (platform === "facebook_group") return <Users size={14} className="text-accent" />;
  return <Share2 size={14} className="text-muted" />;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [comments, setComments] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [replyInput, setReplyInput] = useState({});
  const [replyStatus, setReplyStatus] = useState({});
  const [scheduled, setScheduled] = useState([]);
  const [groupQueue, setGroupQueue] = useState([]);

  const refresh = () => {
    setStats(getStats());
    setActivityLog(getActivityLog());
    setComments(getComments());
    setScheduled(getScheduled());
    setGroupQueue(getGroupQueue());
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000); // auto-refresh every 5s
    return () => clearInterval(id);
  }, []);

  const filteredComments = comments.filter(c =>
    platformFilter === "all" || c.platform === platformFilter
  );

  const handleSendReply = async (commentId) => {
    const text = (replyInput[commentId] || "").trim();
    if (!text) return;

    setReplyStatus(prev => ({ ...prev, [commentId]: "sending" }));

    const keys = (() => {
      try { return JSON.parse(localStorage.getItem("glitch_keys") || "{}"); } catch { return {}; }
    })();

    const comment = comments.find(c => c.id === commentId);
    const platform = comment?.platform;

    let success = false;
    let message = "";

    // Attempt real reply via platform API
    try {
      if (platform === "facebook_page" || platform === "facebook_group") {
        const token = keys.META_PAGE_ACCESS_TOKEN;
        if (token && comment?.comment_id) {
          const res = await fetch(`https://graph.facebook.com/v19.0/${comment.comment_id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, access_token: token })
          });
          if (res.ok) { success = true; message = "Reply posted to Facebook!"; }
          else { const e = await res.json(); message = e.error?.message || "Facebook API error"; }
        } else {
          message = "Facebook token or comment ID not configured. Reply saved locally.";
        }
      } else if (platform === "instagram") {
        const token = keys.META_PAGE_ACCESS_TOKEN;
        if (token && comment?.comment_id) {
          const res = await fetch(`https://graph.facebook.com/v19.0/${comment.comment_id}/replies`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, access_token: token })
          });
          if (res.ok) { success = true; message = "Reply posted to Instagram!"; }
          else { const e = await res.json(); message = e.error?.message || "Instagram API error"; }
        } else {
          message = "Instagram token or comment ID not configured. Reply saved locally.";
        }
      } else if (platform === "linkedin") {
        message = "LinkedIn comment replies require a LinkedIn app with w_member_social scope. Reply saved locally.";
      } else {
        message = "Reply saved locally.";
      }
    } catch (err) {
      message = "Network error. Reply saved locally.";
    }

    // Save reply locally regardless
    const newReply = {
      id: `r-${Date.now()}`,
      author: "You",
      text,
      time: new Date().toLocaleTimeString(),
      sent_live: success
    };

    const updatedComments = comments.map(c =>
      c.id === commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
    );

    setComments(updatedComments);
    localStorage.setItem("glitch_social_comments", JSON.stringify(updatedComments));
    setReplyInput(prev => ({ ...prev, [commentId]: "" }));
    setReplyStatus(prev => ({ ...prev, [commentId]: success ? "sent" : "saved" }));
    
    // Log the action
    const log = getActivityLog();
    log.unshift({ id: `act-${Date.now()}`, type: "reply", platform, text: `Replied: "${text.substring(0,50)}..."`, time: new Date().toISOString() });
    localStorage.setItem("glitch_activity_log", JSON.stringify(log.slice(0, 50)));
    
    setTimeout(() => setReplyStatus(prev => ({ ...prev, [commentId]: null })), 3000);

    alert(message);
  };

  const totalPublished = activityLog.filter(a => a.type === "publish").length;
  const totalScheduled = scheduled.length;
  const totalGroupQueued = groupQueue.length;
  const totalReplies = activityLog.filter(a => a.type === "reply").length;

  const connectedPlatforms = (() => {
    const keys = (() => { try { return JSON.parse(localStorage.getItem("glitch_keys") || "{}"); } catch { return {}; } })();
    return {
      facebook: !!keys.META_PAGE_ACCESS_TOKEN,
      instagram: !!keys.META_IG_BUSINESS_ACCOUNT_ID,
      linkedin: !!keys.LINKEDIN_ACCESS_TOKEN,
      groups: !!(JSON.parse(localStorage.getItem("glitch_fb_groups") || "[]").length)
    };
  })();

  return (
    <div className="relative min-h-screen bg-[#121215] p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">

      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <p className="text-xs text-muted font-mono uppercase tracking-widest">Live Command Center</p>
          <h1 className="text-2xl font-bold text-white font-display mt-1">Broadcast Command Hub</h1>
          <p className="text-xs text-muted mt-1">Only real actions are tracked. Connect social accounts in Settings to activate live metrics.</p>
        </div>

        {/* Tab Selector */}
        <div className="bg-[#161722] p-1.5 rounded-full border border-white/5 flex items-center shadow-inner self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
            }`}
          >
            Overview & Activity
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "comments" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
            }`}
          >
            <MessageSquare size={14} /> Comments ({comments.length})
          </button>
        </div>
      </header>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8">

          {/* Connection Status — real state */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide">Connected Social Accounts</h3>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'settings' }))}
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <SettingsIcon size={11} /> Manage Connections
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Facebook Page", key: "facebook", icon: Facebook, color: "text-blue-400" },
                { label: "Instagram", key: "instagram", icon: Instagram, color: "text-pink-400" },
                { label: "LinkedIn", key: "linkedin", icon: Linkedin, color: "text-sky-400" },
                { label: "FB Groups", key: "groups", icon: Users, color: "text-accent" }
              ].map(({ label, key, icon: Icon, color }) => (
                <div key={key} className={`p-4 rounded-2xl border flex items-center gap-3 ${connectedPlatforms[key] ? "bg-signal/5 border-signal/20" : "bg-white/3 border-white/5"}`}>
                  <Icon size={18} className={connectedPlatforms[key] ? color : "text-muted"} />
                  <div>
                    <p className="text-xs font-bold text-white">{label}</p>
                    <p className={`text-[10px] font-mono ${connectedPlatforms[key] ? "text-signal" : "text-muted"}`}>
                      {connectedPlatforms[key] ? "Connected" : "Not configured"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Real Activity Stats */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-accent-gradient rounded-[28px] p-6 text-white shadow-xl">
              <p className="text-white/80 text-xs font-mono uppercase mb-1">Posts Published</p>
              <h2 className="text-3xl font-display font-bold">{totalPublished}</h2>
              <p className="text-[10px] text-white/70 mt-3 font-mono">Via Command Center</p>
            </div>
            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <p className="text-muted text-xs font-mono uppercase mb-1">Scheduled</p>
              <h2 className="text-3xl font-display font-bold">{totalScheduled}</h2>
              <p className="text-[10px] text-muted mt-3 font-mono">Queued for auto-publish</p>
            </div>
            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <p className="text-muted text-xs font-mono uppercase mb-1">Group Queue</p>
              <h2 className="text-3xl font-display font-bold">{totalGroupQueued}</h2>
              <p className="text-[10px] text-muted mt-3 font-mono">FB group items queued</p>
            </div>
            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <p className="text-muted text-xs font-mono uppercase mb-1">Replies Sent</p>
              <h2 className="text-3xl font-display font-bold">{totalReplies}</h2>
              <p className="text-[10px] text-muted mt-3 font-mono">From this dashboard</p>
            </div>
          </section>

          {/* Quick Control Actions */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 uppercase font-mono">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'composer' }))}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 hover:bg-accent/5 text-white text-xs font-bold transition-all cursor-pointer">
                <Plus size={22} className="text-accent" />
                Draft Post
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'scheduler' }))}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 hover:bg-accent/5 text-white text-xs font-bold transition-all cursor-pointer">
                <Clock size={22} className="text-accent" />
                Scheduler
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'groups' }))}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 hover:bg-accent/5 text-white text-xs font-bold transition-all cursor-pointer">
                <Users size={22} className="text-accent" />
                FB Groups
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'settings' }))}
                className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 hover:bg-accent/5 text-white text-xs font-bold transition-all cursor-pointer">
                <SettingsIcon size={22} className="text-accent" />
                Settings
              </button>
            </div>
          </section>

          {/* Real Activity Log */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-accent" /> Real Activity Log
              </h3>
              {activityLog.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem("glitch_activity_log");
                    setActivityLog([]);
                  }}
                  className="text-[10px] font-mono text-alert hover:underline cursor-pointer"
                >
                  Clear Log
                </button>
              )}
            </div>

            {activityLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-2xl text-center">
                <Activity size={32} className="text-muted/30 mb-3" />
                <p className="text-muted text-xs">No activity yet.</p>
                <p className="text-muted/60 text-[11px] mt-1">Actions you take (publish, schedule, reply) will appear here.</p>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'composer' }))}
                  className="mt-4 px-4 py-2 bg-accent text-[#121215] rounded-full text-xs font-bold cursor-pointer hover:scale-105 transition-all"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                {activityLog.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-[#121215] rounded-2xl border border-white/5 text-xs">
                    <span className="shrink-0">{platformIcon(item.platform)}</span>
                    <span className="text-white flex-1 truncate">{item.text}</span>
                    <span className="text-[10px] font-mono text-muted shrink-0">{new Date(item.time).toLocaleTimeString()}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      item.type === "publish" ? "bg-signal/10 text-signal" :
                      item.type === "schedule" ? "bg-accent/10 text-accent" :
                      "bg-white/5 text-muted"
                    }`}>{item.type}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Scheduled Queue Preview */}
          {totalScheduled > 0 && (
            <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock size={18} className="text-accent" /> Upcoming Scheduled Posts
                </h3>
                <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'scheduler' }))}
                  className="text-xs font-mono text-accent hover:underline cursor-pointer">View All</button>
              </div>
              <div className="space-y-2">
                {scheduled.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-[#121215] rounded-2xl border border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      {platformIcon(s.platform)}
                      <span className="text-white truncate max-w-xs">{s.content?.substring(0, 60)}...</span>
                    </div>
                    <span className="text-muted font-mono shrink-0 ml-2">{new Date(s.scheduled_for).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* COMMENTS & INBOX TAB */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          <div className="bg-surface rounded-[28px] p-5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-2 text-xs text-white font-bold">
              <Filter size={16} className="text-accent" /> Filter by Platform:
            </div>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {["all", "facebook_page", "instagram", "linkedin", "facebook_group"].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-4 py-2 rounded-full text-xs font-mono capitalize transition-all cursor-pointer ${
                    platformFilter === plat ? "bg-accent text-[#121215] font-bold" : "bg-[#121215] text-muted hover:text-white"
                  }`}
                >
                  {plat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/5 rounded-[32px] bg-surface/50 text-center">
              <Inbox size={40} className="text-muted/30 mb-4" />
              <p className="text-muted text-sm font-medium">No comments tracked yet.</p>
              <p className="text-muted/60 text-xs mt-2 max-w-sm leading-relaxed">
                Comments fetched via Facebook & Instagram APIs will appear here once your tokens are configured in Settings.
              </p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('nav-change', { detail: 'settings' }))}
                className="mt-5 px-5 py-2.5 bg-accent text-[#121215] rounded-full text-xs font-bold cursor-pointer hover:scale-105 transition-all"
              >
                Configure API Tokens
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((c) => (
                <div key={c.id} className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                        {c.author?.[0] || "?"}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {c.author}
                          <span className="text-[10px] font-mono uppercase bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                            {c.platform?.replace(/_/g, ' ')}
                          </span>
                        </h4>
                        <p className="text-[11px] text-muted mt-0.5">{c.post_title ? `Post: "${c.post_title}" • ` : ""}{c.time}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white leading-relaxed bg-[#121215] p-4 rounded-2xl border border-white/5">
                    {c.text}
                  </p>

                  {c.replies && c.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-accent/40 space-y-3 pt-1">
                      {c.replies.map((r) => (
                        <div key={r.id} className="bg-[#161722] p-3.5 rounded-2xl border border-white/5 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-accent flex items-center gap-1.5">
                              {r.author}
                              {r.sent_live && <CheckCircle2 size={11} className="text-signal" />}
                            </span>
                            <span className="text-[9px] font-mono text-muted">{r.time}</span>
                          </div>
                          <p className="text-xs text-white">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Write a direct reply..."
                      value={replyInput[c.id] || ""}
                      onChange={(e) => setReplyInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleSendReply(c.id)}
                      className="flex-1 bg-[#121215] border border-white/10 text-white rounded-2xl px-4 py-3 text-xs outline-none focus:border-accent/50"
                    />
                    <button
                      onClick={() => handleSendReply(c.id)}
                      disabled={replyStatus[c.id] === "sending"}
                      className="px-5 py-3 bg-accent text-[#121215] font-bold text-xs rounded-2xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Send size={14} />
                      {replyStatus[c.id] === "sending" ? "Sending..." : replyStatus[c.id] === "sent" ? "✓ Sent!" : "Send Reply"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredComments.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/5 rounded-[32px] bg-surface/50 text-muted text-xs">
                  No comments match the selected platform filter.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
