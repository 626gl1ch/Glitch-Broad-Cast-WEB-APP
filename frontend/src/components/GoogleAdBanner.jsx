import React, { useEffect, useState } from "react";
import { Sparkles, ExternalLink } from "lucide-react";

/**
 * Robust Google Ads Web Unit Component
 * Automatically integrates with Google AdSense (ca-pub-XXXX) and stays resilient against adblockers.
 */
export default function GoogleAdBanner({ slotId = "8821940192", format = "auto", className = "" }) {
  const [adConfig, setAdConfig] = useState(() => {
    try {
      const keys = JSON.parse(localStorage.getItem("glitch_keys") || "{}");
      return {
        client: keys.GOOGLE_ADSENSE_CLIENT_ID || "ca-pub-3940256099942544",
        slot: keys.GOOGLE_ADSENSE_SLOT_ID || slotId
      };
    } catch(e) {
      return { client: "ca-pub-3940256099942544", slot: slotId };
    }
  });

  const [adBlocked, setAdBlocked] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.log("[Google Ads Shield Notice] Script initialization:", e.message);
      setAdBlocked(true);
    }
  }, []);

  return (
    <div className={`w-full my-4 rounded-3xl overflow-hidden border border-accent/20 bg-gradient-to-r from-[#161722]/90 via-[#1e1f2e]/90 to-[#161722]/90 backdrop-blur-md p-4 shadow-xl relative ${className}`}>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
        <span className="flex items-center gap-1.5 text-accent font-semibold">
          <Sparkles size={11} className="text-accent" /> Sponsored Network Banner
        </span>
        <span className="text-[9px] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 font-bold">Google Ads</span>
      </div>

      {/* Google AdSense Display Unit */}
      <div className="w-full flex items-center justify-center min-h-[90px] relative">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", textAlign: "center" }}
          data-ad-client={adConfig.client}
          data-ad-slot={adConfig.slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />

        {/* Fallback Banner (Never links to repository) */}
        {adBlocked && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-surface/80 rounded-2xl border border-white/5 text-left shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white shrink-0 font-bold shadow-md">
                GB
              </div>
              <div>
                <h5 className="text-xs font-bold text-white tracking-tight">Glitch Broadcast AI Command</h5>
                <p className="text-[11px] text-muted leading-tight">Scale your multi-channel reach across Facebook Pages, Instagram, LinkedIn & Groups.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full shrink-0">
              AdSense Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
