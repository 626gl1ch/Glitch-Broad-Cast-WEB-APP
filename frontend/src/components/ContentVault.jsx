import React, { useEffect, useState } from "react";
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Trash2, 
  FolderOpen, 
  Search, 
  Tag, 
  Wand2, 
  CheckCircle2, 
  Copy,
  Plus
} from "lucide-react";
import { api } from "../api";
import { checkUsageLimit, incrementUsageCount } from "../utils/usage";

const FOLDERS = ["general", "brand-assets", "product-shots", "trading-charts", "drafts"];

export default function ContentVault() {
  const [items, setItems] = useState([]);
  const [folder, setFolder] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [generatingAltId, setGeneratingAltId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = () => {
    api.listFiles(folder)
      .then((data) => {
        if (data && data.length > 0) {
          setItems(data);
        } else {
          setItems(getMockFiles(folder));
        }
      })
      .catch(() => {
        setItems(getMockFiles(folder));
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [folder]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8787/api"}/files/upload`, {
        method: "POST",
        body: formData,
      });
      load();
    } catch (_) {
      // Simulate successful local upload in demo mode
      const newItem = {
        id: `file-${Date.now()}`,
        name: file.name,
        folder,
        file_url: URL.createObjectURL(file),
        file_type: file.type.startsWith("image/") ? "image" : "document",
        tags: ["uploaded", folder],
        notes: null,
        created_at: new Date().toISOString()
      };
      setItems((prev) => [newItem, ...prev]);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await api.deleteFile(id);
      load();
    } catch (_) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const copyUrl = (item) => {
    navigator.clipboard.writeText(item.file_url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const generateAltText = (item) => {
    if (checkUsageLimit()) {
      window.dispatchEvent(new Event("glitch-usage-change"));
      return;
    }
    setGeneratingAltId(item.id);
    // Simulate Gemini generating alt text
    setTimeout(() => {
      setItems((prev) => prev.map((i) => {
        if (i.id === item.id) {
          return {
            ...i,
            notes: `Gemini Alt Text: A high-contrast graphic detailing ${item.name.replace(/\.[^/.]+$/, "")} with dark mode styling.`
          };
        }
        return i;
      }));
      setGeneratingAltId(null);
      incrementUsageCount();
    }, 1500);
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    return item.name.toLowerCase().includes(search.toLowerCase()) || 
           (item.notes && item.notes.toLowerCase().includes(search.toLowerCase())) ||
           (item.tags && item.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
  });

  return (
    <div className="p-8 relative min-h-screen">
      {/* Background Glow */}
      <div className="glow-blob w-[500px] h-[500px] bg-[#43FFB0]/3 -top-20 -right-20 opacity-60" />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#43FFB0]">
            <FolderOpen size={12} className="text-[#43FFB0]" /> Asset Manager
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-1.5">
            Content Vault
          </h1>
          <p className="text-[#8B93A7] text-xs mt-0.5">
            Store product screenshots, algo-trading charts, drafts, and log images.
          </p>
        </div>

        {/* Upload Button */}
        <label className={`flex items-center gap-2 bg-gradient-to-r from-[#43FFB0]/20 to-[#8B7CFF]/20 hover:from-[#43FFB0]/30 hover:to-[#8B7CFF]/30 border border-[#43FFB0]/30 text-white font-medium text-xs px-5 py-3 rounded-xl transition-all shrink-0 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}`}>
          <Upload size={14} className="text-[#43FFB0]" />
          <span>{uploading ? "Uploading..." : "Upload New File"}</span>
          <input type="file" className="hidden" onChange={handleUpload} accept="image/*,application/pdf" disabled={uploading} />
        </label>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        {/* Folders Navigation */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin w-full md:w-auto pb-2 md:pb-0">
          {FOLDERS.map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`text-[11px] font-mono px-4 py-2 rounded-full border transition-all duration-200 uppercase tracking-wider shrink-0 ${
                folder === f
                  ? "border-[#43FFB0] text-[#43FFB0] bg-[#43FFB0]/5"
                  : "border-white/5 text-[#8B93A7] bg-white/[0.01] hover:text-white hover:border-white/10"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2.5 bg-[#090C12] border border-white/5 rounded-xl px-3 py-2 w-full md:w-64 focus-within:border-[#43FFB0]/30 transition-all duration-200">
          <Search size={14} className="text-[#5C6478]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets or tags..."
            className="bg-transparent outline-none text-xs placeholder:text-[#5C6478] text-white w-full"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredItems.map((item) => (
          <div key={item.id} className="glass-panel rounded-2xl overflow-hidden group flex flex-col justify-between hover:border-white/10 transition-all duration-300">
            {/* Visual Thumbnail */}
            <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center border-b border-white/5">
              {item.file_type === "image" ? (
                <img 
                  src={item.file_url} 
                  alt={item.notes || item.name} 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#8B93A7]">
                  <File size={36} strokeWidth={1.5} />
                  <span className="text-[10px] font-mono uppercase text-[#5C6478]">PDF / Document</span>
                </div>
              )}

              {/* Quick Actions Hover Overlay */}
              <div className="absolute inset-0 bg-[#06080C]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(item)}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#E4E7EC] hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Copy File URL"
                >
                  {copiedId === item.id ? <CheckCircle2 size={15} className="text-[#43FFB0]" /> : <Copy size={15} />}
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-[#FF5C7A] hover:bg-[#FF5C7A]/10 hover:border-[#FF5C7A]/25 transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Asset Info */}
            <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white truncate" title={item.name}>{item.name}</h4>
                <p className="text-[10px] font-mono text-[#5C6478]">
                  {new Date(item.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>

              {/* Alt Text Area */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                {item.notes ? (
                  <p className="text-[10px] text-[#8B93A7] leading-relaxed italic bg-white/[0.01] p-2 rounded border border-white/5 max-h-16 overflow-y-auto scrollbar-thin">
                    {item.notes}
                  </p>
                ) : item.file_type === "image" ? (
                  <button
                    onClick={() => generateAltText(item)}
                    disabled={generatingAltId === item.id}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#8B7CFF]/5 border border-[#8B7CFF]/15 text-[#8B7CFF] hover:bg-[#8B7CFF]/15 text-[10px] font-mono transition-all"
                  >
                    <Wand2 size={11} />
                    {generatingAltId === item.id ? "Analyzing with Gemini..." : "Generate Alt Text"}
                  </button>
                ) : null}
              </div>

              {/* Tag Chips */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5">
                  {item.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="text-[9px] font-mono text-[#5C6478] bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-4 text-center py-20 text-xs text-[#5C6478] border border-dashed border-white/5 rounded-2xl">
            <ImageIcon size={28} className="mx-auto mb-3 opacity-30 text-[#8B93A7]" />
            No files in folder "{folder}" matching search terms.
          </div>
        )}
      </div>

    </div>
  );
}

function getMockFiles(folder) {
  const images = {
    general: [
      { id: "img-1", name: "glitch_logo_dark.png", folder: "general", file_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300", file_type: "image", tags: ["logo", "glitch", "brand"], notes: "Glitch EnterPrice primary horizontal layout, transparent backing.", created_at: new Date().toISOString() },
      { id: "doc-1", name: "social_broadcast_pitch.pdf", folder: "general", file_url: "#", file_type: "document", tags: ["pitch", "pdf"], notes: "Product plan guidelines for Meta and LinkedIn apps.", created_at: new Date().toISOString() }
    ],
    "brand-assets": [
      { id: "img-2", name: "banner_cyan_purple.png", folder: "brand-assets", file_url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=300", file_type: "image", tags: ["banner", "neon", "social"], notes: "CosmoQ Framer template header style vector image.", created_at: new Date().toISOString() }
    ],
    "product-shots": [
      { id: "img-3", name: "command_center_preview.png", folder: "product-shots", file_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=300", file_type: "image", tags: ["shot", "ui", "dashboard"], notes: "High fidelity interface mockup for Glitch Broadcast.", created_at: new Date().toISOString() }
    ],
    "trading-charts": [
      { id: "img-4", name: "bybit_eth_60d_backtest.png", folder: "trading-charts", file_url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=300", file_type: "image", tags: ["bybit", "backtest", "eth"], notes: null, created_at: new Date().toISOString() }
    ],
    drafts: []
  };
  return images[folder] || [];
}
