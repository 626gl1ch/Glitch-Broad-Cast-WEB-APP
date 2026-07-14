import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import TermsModal from "./components/TermsModal";
import Dashboard from "./components/Dashboard";
import ChatPanel from "./components/ChatPanel";
import ContentVault from "./components/ContentVault";
import Composer from "./components/Composer";
import Scheduler from "./components/Scheduler";
import GroupsAssisted from "./components/GroupsAssisted";
import Settings from "./components/Settings";
import MarketingPlaybook from "./components/MarketingPlaybook";
import AuthModal from "./components/AuthModal";
import GoogleAdBanner from "./components/GoogleAdBanner";

const VIEWS = {
  dashboard: Dashboard,
  chat: ChatPanel,
  vault: ContentVault,
  composer: Composer,
  scheduler: Scheduler,
  groups: GroupsAssisted,
  settings: Settings,
  playbook: MarketingPlaybook,
};

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [session, setSession] = useState(null);

  // CRITICAL FIX: Listen to nav-change custom events from child components
  useEffect(() => {
    const handleNavChange = (e) => {
      const target = e.detail;
      if (target && VIEWS[target]) {
        setActive(target);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("nav-change", handleNavChange);
    return () => window.removeEventListener("nav-change", handleNavChange);
  }, []);

  // Load draft from playbook "Send to Composer"
  useEffect(() => {
    const handleStorage = () => {
      const draft = localStorage.getItem("glitch_composer_draft");
      if (draft) {
        setActive("composer");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const View = VIEWS[active];

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative">
      <div className="fixed inset-0 z-[-1]" style={{ backgroundImage: 'var(--bg-gradient)' }} />
      <AuthModal session={session} setSession={setSession} />
      <TermsModal />
      <Sidebar active={active} onChange={setActive} />
      
      <main className="flex-1 overflow-y-auto scrollbar-thin pb-28 md:pb-6 px-4 md:px-8 pt-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header Google Ads Banner */}
          <GoogleAdBanner slotId="8821940192" className="max-w-6xl mx-auto" />
          
          <div key={active} className="page-transition min-h-full">
            <View />
          </div>
        </div>
      </main>
      
      <MobileNav active={active} onChange={setActive} />
    </div>
  );
}
