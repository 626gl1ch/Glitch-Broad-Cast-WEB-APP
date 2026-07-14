import React, { useEffect, useState } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  PlayCircle, 
  CheckCircle2, 
  ExternalLink,
  Search,
  Copy,
  FolderPlus,
  Info,
  Sparkles,
  Upload,
  X,
  Layers
} from "lucide-react";
import { api } from "../api";

const DEFAULT_GROUPS = [
  { id: "g-1", name: "Nigerian Tech & Algo Traders", url: "https://facebook.com/groups/nigerian-algo-traders", category: "Trading", autoApprove: true },
  { id: "g-2", name: "Build in Public Africa", url: "https://facebook.com/groups/build-in-public-africa", category: "Developers", autoApprove: false },
  { id: "g-3", name: "SaaS Builders & Founders", url: "https://facebook.com/groups/saas-builders", category: "SaaS", autoApprove: true }
];

export default function GroupsAssisted() {
  const [activeTab, setActiveTab] = useState("directory"); // directory | queue
  const [groups, setGroups] = useState([]);
  const [queue, setQueue] = useState([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupUrl, setGroupUrl] = useState("");
  const [groupCategory, setGroupCategory] = useState("General");

  // Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Load Groups & Queue from localStorage / backend
  useEffect(() => {
    const savedGroups = localStorage.getItem("glitch_fb_groups");
    if (savedGroups) {
      try {
        setGroups(JSON.parse(savedGroups));
      } catch (e) {
        setGroups(DEFAULT_GROUPS);
      }
    } else {
      setGroups(DEFAULT_GROUPS);
      localStorage.setItem("glitch_fb_groups", JSON.stringify(DEFAULT_GROUPS));
    }

    loadQueue();
  }, []);

  const saveGroupsList = (newList) => {
    setGroups(newList);
    localStorage.setItem("glitch_fb_groups", JSON.stringify(newList));
  };

  const loadQueue = () => {
    api.getGroupQueue().then(data => setQueue(data)).catch(() => {
      const saved = localStorage.getItem("glitch_group_queue");
      setQueue(saved ? JSON.parse(saved) : []);
    });
  };

  // Group CRUD Actions
  const handleSaveGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim() || !groupUrl.trim()) return;

    if (editingGroupId) {
      const updated = groups.map(g => g.id === editingGroupId ? { ...g, name: groupName, url: groupUrl, category: groupCategory } : g);
      saveGroupsList(updated);
    } else {
      const newGroup = {
        id: `g-${Date.now()}`,
        name: groupName.trim(),
        url: groupUrl.trim(),
        category: groupCategory.trim() || "General",
        created_at: new Date().toISOString()
      };
      saveGroupsList([newGroup, ...groups]);
    }

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupUrl("");
    setGroupCategory("General");
  };

  const handleDeleteGroup = (id) => {
    if (confirm("Are you sure you want to delete this group?")) {
      const filtered = groups.filter(g => g.id !== id);
      saveGroupsList(filtered);
    }
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split("\n").filter(Boolean);
    const imported = lines.map((line, idx) => {
      const parts = line.split(",").map(p => p.trim());
      const name = parts[0] || `Imported Group ${idx + 1}`;
      const url = parts[1] || parts[0];
      const category = parts[2] || "Bulk Import";
      return {
        id: `g-bulk-${Date.now()}-${idx}`,
        name: name.startsWith("http") ? `Group ${idx + 1}` : name,
        url: url.startsWith("http") ? url : `https://${url}`,
        category
      };
    });

    saveGroupsList([...imported, ...groups]);
    setShowImportModal(false);
    setBulkText("");
  };

  // Launch Assisted Post (Web Helper)
  const handleLaunchAssistedPost = (item) => {
    // Copy content to clipboard
    const caption = item.post_variants?.content || item.content || "";
    if (caption) {
      navigator.clipboard.writeText(caption);
    }
    
    // Open target group URL in new tab
    window.open(item.group_url || item.url, "_blank");

    // Mark as running / awaiting manual click in queue
    const updatedQueue = queue.map(q => q.id === item.id ? { ...q, status: "awaiting_manual_click" } : q);
    setQueue(updatedQueue);
    localStorage.setItem("glitch_group_queue", JSON.stringify(updatedQueue));
  };

  const handleMarkDone = (id) => {
    const updatedQueue = queue.map(q => q.id === id ? { ...q, status: "done" } : q);
    setQueue(updatedQueue);
    localStorage.setItem("glitch_group_queue", JSON.stringify(updatedQueue));
  };

  const categories = ["all", ...Array.from(new Set(groups.map(g => g.category || "General")))];

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || g.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 md:p-8 relative min-h-screen bg-[#121215] pb-32">
      {/* Glow background */}
      <div className="glow-blob w-[500px] h-[500px] bg-accent/10 -top-20 -right-20 opacity-60 pointer-events-none" />

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 max-w-6xl mx-auto relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/10 px-3.5 py-1.5 rounded-full border border-accent/20 w-fit font-bold">
            <Users size={14} className="text-accent" /> Group Operations Engine
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white mt-2">
            Facebook Groups Directory & Assister
          </h1>
          <p className="text-muted text-[13px] max-w-2xl mt-1.5 font-light leading-relaxed">
            Manage an unlimited directory of Facebook Groups, select groups for bulk cross-posting in Composer, and execute assisted posting.
          </p>
        </div>

        {/* Tab Switcher & Quick Add Buttons */}
        <div className="flex items-center gap-3">
          <div className="bg-[#161722] p-1.5 rounded-full border border-white/5 flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "directory" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
              }`}
            >
              Groups Directory ({groups.length})
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                activeTab === "queue" ? "bg-accent text-[#121215] shadow-md" : "text-muted hover:text-white"
              }`}
            >
              Assisted Queue ({queue.length})
            </button>
          </div>
        </div>
      </div>

      {/* Directory Tab View */}
      {activeTab === "directory" && (
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          
          {/* Controls Bar */}
          <div className="bg-surface rounded-[32px] p-5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups by name or URL..."
                  className="w-full bg-[#121215] rounded-full pl-11 pr-4 py-3 text-white text-xs font-mono placeholder:text-muted outline-none border border-transparent focus:border-accent/40 shadow-inner"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-full text-[11px] font-mono capitalize transition-all shrink-0 ${
                      categoryFilter === cat ? "bg-white/10 text-accent font-bold border border-accent/30" : "bg-[#121215] text-muted hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Upload size={14} /> Bulk Import
              </button>

              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 text-xs font-bold px-5 py-3 rounded-full bg-accent text-[#121215] hover:scale-105 transition-all shadow-md cursor-pointer"
              >
                <Plus size={16} /> Add Group
              </button>
            </div>
          </div>

          {/* Groups Directory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((g) => (
              <div
                key={g.id}
                className="bg-surface rounded-[28px] p-5 border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-mono uppercase bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20 font-bold">
                      {g.category || "General"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGroupId(g.id);
                          setGroupName(g.name);
                          setGroupUrl(g.url);
                          setGroupCategory(g.category || "General");
                          setShowModal(true);
                        }}
                        className="p-2 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
                        className="p-2 text-muted hover:text-alert rounded-lg hover:bg-alert/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-white text-base tracking-tight truncate">{g.name}</h3>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 mt-1 truncate"
                  >
                    <span>{g.url}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-muted font-mono">
                  <span>Target Status: Active</span>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:text-accent font-bold flex items-center gap-1"
                  >
                    Open Group <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[32px] bg-surface/40">
                <Users size={36} className="text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm font-bold text-white">No groups found</p>
                <p className="text-xs text-muted mt-1">Add your target Facebook Groups or import a list to begin cross-posting.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Queue Tab View */}
      {activeTab === "queue" && (
        <div className="max-w-6xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-base font-bold text-white tracking-tight">Assisted Queue & Helper Launcher</h3>
            <button onClick={loadQueue} className="text-xs text-accent font-bold hover:underline">Refresh List</button>
          </div>

          <div className="space-y-4">
            {queue.map((item) => {
              const isDone = item.status === "done";
              const caption = item.post_variants?.content || item.content || "Target copy set for cross-posting.";

              return (
                <div key={item.id} className="bg-surface rounded-[28px] p-6 border border-white/5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${isDone ? "bg-signal/20 text-signal border border-signal/30" : "bg-accent/20 text-accent border border-accent/30"}`}>
                          {isDone ? "Posted" : "Queued"}
                        </span>
                        <a href={item.group_url} target="_blank" rel="noreferrer" className="text-xs font-mono text-accent hover:underline truncate flex items-center gap-1">
                          {item.group_url} <ExternalLink size={12} />
                        </a>
                      </div>
                      <p className="text-xs text-white leading-relaxed bg-[#121215] p-4 rounded-2xl border border-white/5 mt-2 line-clamp-3">
                        {caption}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(caption);
                          alert("Caption text copied to clipboard!");
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold flex items-center gap-2 border border-white/5 transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        <Copy size={16} />
                      </button>

                      {!isDone ? (
                        <button
                          onClick={() => handleLaunchAssistedPost(item)}
                          className="px-5 py-3 bg-accent text-[#121215] font-bold text-xs rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                          <PlayCircle size={16} /> Launch Assisted Post
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-signal font-bold px-4 py-2 rounded-2xl bg-signal/10">
                          <CheckCircle2 size={16} /> Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {queue.length === 0 && (
              <div className="text-center py-24 border border-dashed border-white/5 rounded-[32px] bg-surface/50 text-muted text-xs">
                No active Facebook Group queued posts. Use the Composer to draft and queue posts across groups.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-white/10 rounded-[32px] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingGroupId ? "Edit Facebook Group" : "Add Facebook Group"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono text-muted mb-1">Group Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algo Traders Community"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#161722] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-accent/40"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-muted mb-1">Facebook Group URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://facebook.com/groups/1234567"
                  value={groupUrl}
                  onChange={(e) => setGroupUrl(e.target.value)}
                  className="w-full bg-[#161722] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-accent/40"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-muted mb-1">Category / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Trading, SaaS, Tech"
                  value={groupCategory}
                  onChange={(e) => setGroupCategory(e.target.value)}
                  className="w-full bg-[#161722] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-accent/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-accent text-[#121215] rounded-full hover:scale-105 transition-all"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-white/10 rounded-[32px] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-lg font-bold text-white">Bulk Import Facebook Groups</h3>
              <button onClick={() => setShowImportModal(false)} className="text-muted hover:text-white"><X size={18} /></button>
            </div>

            <p className="text-xs text-muted">
              Paste your list of Facebook Groups (one per line). Format: <code className="text-accent">Group Name, URL, Category</code> or simply paste group URLs:
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Algo Traders, https://facebook.com/groups/algotraders, Trading\nTech Developers, https://facebook.com/groups/techdevs, Tech`}
              className="w-full bg-[#161722] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white outline-none focus:border-accent/40"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2.5 text-xs text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="px-5 py-2.5 text-xs font-bold bg-accent text-[#121215] rounded-full hover:scale-105 transition-all"
              >
                Import All Groups
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
