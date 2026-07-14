import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("[Glitch Safeguard] Caught unhandled runtime exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06080C] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-alert/20 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-alert/10 text-alert flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight">System Notice Intercepted</h2>
            <p className="text-xs text-muted leading-relaxed">
              A browser extension or runtime event was safely caught by the application shield. All core features remain operational.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-accent text-[#06080C] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all cursor-pointer"
            >
              <RefreshCw size={16} /> Restore Command Center
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
