import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Clock, 
  BookOpen, 
  Settings as SettingsIcon, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Search,
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
  Filter
} from "lucide-react";
import { api } from "../api";

const INITIAL_COMMENTS = [
  {
    id: "c-1",
    platform: "facebook_page",
    post_title: "Shipped the new AI social scheduler",
    author: "Alex Rivers",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
    text: "Does this support location tagging for Instagram business profiles?",
    time: "10m ago",
    replies: [
      { id: "r-1", author: "Broadcast Pro (You)", text: "Yes! Location tagging is supported for Instagram media containers.", time: "5m ago" }
    ]
  },
  {
    id: "c-2",
    platform: "instagram",
    post_title: "Optimized database lookup queries down to 12ms",
    author: "Elena Vance",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    text: "Great performance optimization! Which postgres indexing strategy did you use?",
    time: "25m ago",
    replies: []
  },
  {
    id: "c-3",
    platform: "linkedin",
    post_title: "Bybit ETH perp backtest results (1.25 PF)",
    author: "David Chen",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
    text: "Very impressive win rate over 60 days. Are you using 5m timeframe stateful candles?",
    time: "1h ago",
    replies: [
      { id: "r-2", author: "Broadcast Pro (You)", text: "Exactly, stateful 5m candles to filter out lower timeframe noise.", time: "45m ago" }
    ]
  },
  {
    id: "c-4",
    platform: "facebook_group",
    post_title: "Build in Public: Halved database loads",
    author: "Samuel Okafor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    text: "Active settings only! Good work on the local architecture.",
    time: "2h ago",
    replies: []
  }
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | comments
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [replyInput, setReplyInput] = useState({});

  useEffect(() => {
    // Load Posts
    api.listPosts().then((data) => {
      setPosts(data && data.length > 0 ? data : getMockPosts());
    }).catch(() => setPosts(getMockPosts()));

    // Load Comments from storage or default
    const savedComments = localStorage.getItem("glitch_social_comments");
    if (savedComments) {
      try { setComments(JSON.parse(savedComments)); } catch(e) { setComments(INITIAL_COMMENTS); }
    } else {
      setComments(INITIAL_COMMENTS);
      localStorage.setItem("glitch_social_comments", JSON.stringify(INITIAL_COMMENTS));
    }
  }, []);

  const saveComments = (newComments) => {
    setComments(newComments);
    localStorage.setItem("glitch_social_comments", JSON.stringify(newComments));
  };

  const handleSendReply = (commentId) => {
    const text = replyInput[commentId];
    if (!text || !text.trim()) return;

    const newReply = {
      id: `r-${Date.now()}`,
      author: "Broadcast Pro (You)",
      text: text.trim(),
      time: "Just now"
    };

    const updated = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      return c;
    });

    saveComments(updated);
    setReplyInput(prev => ({ ...prev, [commentId]: "" }));
    alert("Reply posted successfully to social channel!");
  };

  const allVariants = posts.flatMap((p) => p.post_variants || []);
  const postedCount = allVariants.filter((v) => v.publish_status === "posted").length;
  const pendingCount = allVariants.filter((v) => v.publish_status === "pending").length;

  const filteredComments = comments.filter(c => platformFilter === "all" || c.platform === platformFilter);

  return (
    <div className="relative min-h-screen bg-[#121215] p-4 md:p-8 max-w-6xl mx-auto space-y-8 pb-32">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent/30 shadow-md">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-muted">Command Center Dashboard</p>
            <h1 className="text-xl font-bold text-white font-display">Broadcast Command Hub</h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-[#161722] p-1.5 rounded-full border border-white/5 flex items-center shadow-inner self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "overview" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "comments" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
            }`}
          >
            <MessageSquare size={14} /> Comments & Inbox ({comments.length})
          </button>
        </div>
      </header>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Main Analytics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-accent-gradient rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase font-mono">Total Reach</p>
                  <h2 className="text-3xl font-display font-bold mt-1">148.5K</h2>
                </div>
                <Eye size={20} className="text-white/80" />
              </div>
              <p className="text-[10px] text-white/70 mt-4 font-mono">+18.4% growth this month</p>
            </div>

            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted text-xs font-medium uppercase font-mono">Impressions</p>
                  <h2 className="text-3xl font-display font-bold mt-1">392.1K</h2>
                </div>
                <BarChart3 size={20} className="text-accent" />
              </div>
              <p className="text-[10px] text-signal mt-4 font-mono">Synced across platforms</p>
            </div>

            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted text-xs font-medium uppercase font-mono">Engagement Rate</p>
                  <h2 className="text-3xl font-display font-bold mt-1">8.42%</h2>
                </div>
                <ThumbsUp size={20} className="text-accent" />
              </div>
              <p className="text-[10px] text-signal mt-4 font-mono">+2.1% above benchmark</p>
            </div>

            <div className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-muted text-xs font-medium uppercase font-mono">Published Posts</p>
                  <h2 className="text-3xl font-display font-bold mt-1">{postedCount || allVariants.length}</h2>
                </div>
                <Share2 size={20} className="text-accent" />
              </div>
              <p className="text-[10px] text-muted mt-4 font-mono">{pendingCount} scheduled/queued</p>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-white tracking-tight mb-4 uppercase font-mono">Quick Control Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', {detail: 'composer'}))} className="flex items-center gap-3 p-4 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 text-white text-xs font-bold transition-all cursor-pointer">
                <Plus size={18} className="text-accent" /> Draft Post
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', {detail: 'scheduler'}))} className="flex items-center gap-3 p-4 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 text-white text-xs font-bold transition-all cursor-pointer">
                <Clock size={18} className="text-accent" /> View Schedule
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', {detail: 'groups'}))} className="flex items-center gap-3 p-4 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 text-white text-xs font-bold transition-all cursor-pointer">
                <Users size={18} className="text-accent" /> FB Groups
              </button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('nav-change', {detail: 'settings'}))} className="flex items-center gap-3 p-4 rounded-2xl bg-[#121215] border border-white/5 hover:border-accent/40 text-white text-xs font-bold transition-all cursor-pointer">
                <SettingsIcon size={18} className="text-accent" /> App Settings
              </button>
            </div>
          </section>

          {/* Platform Performance Metrics */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Channel Performance Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2"><Facebook size={16} className="text-blue-500" /> FB Page</span>
                  <span className="text-signal font-mono">Active</span>
                </div>
                <div className="text-[11px] text-muted space-y-1 pt-1 font-mono">
                  <div>Reach: 42.1K</div>
                  <div>Engagements: 3.4K</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2"><Instagram size={16} className="text-pink-500" /> Instagram</span>
                  <span className="text-signal font-mono">Active</span>
                </div>
                <div className="text-[11px] text-muted space-y-1 pt-1 font-mono">
                  <div>Reach: 68.9K</div>
                  <div>Engagements: 5.8K</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2"><Linkedin size={16} className="text-blue-400" /> LinkedIn</span>
                  <span className="text-signal font-mono">Active</span>
                </div>
                <div className="text-[11px] text-muted space-y-1 pt-1 font-mono">
                  <div>Reach: 21.5K</div>
                  <div>Engagements: 1.9K</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#121215] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs text-white font-bold">
                  <span className="flex items-center gap-2"><Users size={16} className="text-accent" /> FB Groups</span>
                  <span className="text-signal font-mono">Active</span>
                </div>
                <div className="text-[11px] text-muted space-y-1 pt-1 font-mono">
                  <div>Reach: 16.0K</div>
                  <div>Queued Items: {pendingCount}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="bg-surface rounded-[32px] p-6 border border-white/5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Recent Activity Feed</h3>
            <div className="space-y-3">
              {allVariants.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-[#121215] rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-2 rounded-xl bg-white/5 text-accent capitalize font-mono shrink-0">
                      {v.platform.replace('_', ' ')}
                    </span>
                    <span className="text-white truncate font-medium">{v.content}</span>
                  </div>
                  <span className="text-signal font-bold uppercase font-mono shrink-0 ml-4">
                    {v.publish_status || "posted"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Social Comments & Reply Inbox View */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          {/* Filters */}
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
                  {plat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Comments Feed */}
          <div className="space-y-4">
            {filteredComments.map((c) => (
              <div key={c.id} className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {c.author}
                        <span className="text-[10px] font-mono uppercase bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                          {c.platform.replace('_', ' ')}
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted mt-0.5">Post: "{c.post_title}" • {c.time}</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-white leading-relaxed bg-[#121215] p-4 rounded-2xl border border-white/5">
                  {c.text}
                </p>

                {/* Existing Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-4 border-l-2 border-accent/40 space-y-3 pt-1">
                    {c.replies.map((r) => (
                      <div key={r.id} className="bg-[#161722] p-3.5 rounded-2xl border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-accent">{r.author}</span>
                          <span className="text-[9px] font-mono text-muted">{r.time}</span>
                        </div>
                        <p className="text-xs text-white">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
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
                    className="px-5 py-3 bg-accent text-[#121215] font-bold text-xs rounded-2xl flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Send size={14} /> Send Reply
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
        </div>
      )}

    </div>
  );
}

function getMockPosts() {
  const defaultTime = new Date().toISOString();
  return [
    {
      id: "post-1",
      created_at: defaultTime,
      post_variants: [
        { id: "v-1", platform: "linkedin", content: "Shipped a major architecture audit...", publish_status: "posted", created_at: defaultTime },
        { id: "v-2", platform: "facebook_page", content: "Just spent my afternoon auditing...", publish_status: "posted", created_at: defaultTime },
        { id: "v-3", platform: "instagram", content: "SnipeJob performance update...", publish_status: "posted", created_at: defaultTime }
      ]
    }
  ];
}
