import React, { useState } from "react";
import {
  RadioTower,
  MessageSquare,
  FolderOpen,
  PenSquare,
  Menu,
  X,
  CalendarClock,
  Users,
  Settings as SettingsIcon,
  BookOpen
} from "lucide-react";

const MORE_NAV = [
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "groups", label: "Groups", icon: Users },
  { id: "playbook", label: "Playbook", icon: BookOpen },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function MobileNav({ active, onChange }) {
  const [showMore, setShowMore] = useState(false);

  const handleSelect = (id) => {
    onChange(id);
    setShowMore(false);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex flex-col justify-end p-4 pb-32 animate-in fade-in duration-200">
          <div className="bg-surface/90 border border-white/5 rounded-4xl p-2 space-y-1 mb-2 shadow-2xl backdrop-blur-xl">
            <div className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-widest border-b border-white/5 mb-2">
              More Tools
            </div>
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-3xl text-sm transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-white/5">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full flex items-center justify-center gap-4 px-5 py-4 rounded-3xl text-sm font-bold text-alert bg-alert/5 hover:bg-alert/10 transition-colors uppercase tracking-widest cursor-pointer"
              >
                System Reset (Logout)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation Bar */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <nav className="bg-surface/95 border border-white/5 backdrop-blur-2xl rounded-[32px] px-2 h-[72px] flex justify-between items-center shadow-2xl">
          {/* Left Items */}
          <div className="flex items-center justify-evenly w-[40%]">
            <button
              onClick={() => handleSelect("dashboard")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                active === "dashboard" ? "text-white" : "text-muted"
              }`}
            >
              <RadioTower size={22} className={active === "dashboard" ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
              <span className="text-[10px] font-medium tracking-wide">Home</span>
            </button>
            <button
              onClick={() => handleSelect("vault")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                active === "vault" ? "text-white" : "text-muted"
              }`}
            >
              <FolderOpen size={22} className={active === "vault" ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
              <span className="text-[10px] font-medium tracking-wide">Vault</span>
            </button>
          </div>

          {/* Center FAB Overlay */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <button
              onClick={() => handleSelect("composer")}
              className="w-[60px] h-[60px] rounded-full bg-accent text-base flex items-center justify-center shadow-[0_8px_20px_rgba(176,139,255,0.4)] transition-transform hover:scale-105 active:scale-95 border-4 border-[#121215]"
            >
              <PenSquare size={26} className="text-white" />
            </button>
          </div>

          {/* Right Items */}
          <div className="flex items-center justify-evenly w-[40%]">
            <button
              onClick={() => handleSelect("scheduler")}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                active === "scheduler" ? "text-white" : "text-muted"
              }`}
            >
              <CalendarClock size={22} className={active === "scheduler" ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""} />
              <span className="text-[10px] font-medium tracking-wide">History</span>
            </button>
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors ${
                showMore ? "text-white" : "text-muted"
              }`}
            >
              {showMore ? <X size={22} /> : <Menu size={22} />}
              <span className="text-[10px] font-medium tracking-wide">More</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
