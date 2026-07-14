import React, { useEffect } from "react";
import { Sparkles, ExternalLink } from "lucide-react";

/**
 * Responsive Google Ads Banner Component for Web App
 * Supports live Google AdSense ads and fallback responsive ad banners.
 */
export default function GoogleAdBanner({ slotId = "1234567890", format = "auto", className = "" }) {
  const adClientId = "ca-pub-3940256099942544"; // Replace with your Google AdSense Publisher ID if needed

  useEffect(() => {
    try {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.log("AdSense load notice:", e);
    }
  }, []);

  return (
    <div className={`w-full my-4 rounded-2xl overflow-hidden border border-accent/20 bg-gradient-to-r from-[#161722]/90 via-[#1e1f2e]/90 to-[#161722]/90 backdrop-blur-md p-3.5 shadow-lg relative ${className}`}>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
        <span className="flex items-center gap-1.5 text-accent font-semibold">
          <Sparkles size={11} className="text-accent" /> Sponsored Advertisement
        </span>
        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">Google Ads</span>
      </div>

      {/* Google AdSense Unit */}
      <div className="w-full flex items-center justify-center min-h-[90px]">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", textAlign: "center" }}
          data-ad-client={adClientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        
        {/* Visual Fallback Container in case AdSense script is blocked or initializing */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface/60 rounded-xl border border-white/5 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white shrink-0 font-bold shadow-md">
              GB
            </div>
            <div>
              <h5 className="text-xs font-bold text-white tracking-tight">Glitch Broad-Cast AI Suite</h5>
              <p className="text-[11px] text-muted leading-tight">Scale your social reach to 100k+ followers automatically using Gemini AI</p>
            </div>
          </div>
          <a
            href="https://github.com/626gl1ch/Glitch-Broad-Cast-WEB-APP"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/30 px-3.5 py-2 rounded-xl hover:bg-accent hover:text-[#121215] transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Learn More</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
