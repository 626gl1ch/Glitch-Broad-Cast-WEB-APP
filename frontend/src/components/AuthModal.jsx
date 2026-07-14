import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  let keys = {};
  try {
    keys = JSON.parse(localStorage.getItem("glitch_keys") || "{}");
  } catch (e) {
    keys = {};
  }
  return {
    url: keys.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://mdmpcxtjwnovbhidwwhj.supabase.co',
    key: keys.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy'
  };
};

export default function AuthModal({ session, setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const config = getSupabaseConfig();
  const supabase = config.url && config.key ? createClient(config.url, config.key) : null;

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        localStorage.setItem("supabase_jwt", session.access_token);
      }
    }).catch(err => console.log("Supabase session notice:", err));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem("supabase_jwt", session.access_token);
      } else {
        localStorage.removeItem("supabase_jwt");
      }
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  // If already authenticated or dismissed for guest access, hide modal
  if (session || dismissed) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#121215] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-gradient"></div>
        <h2 className="text-2xl font-bold font-display text-white mb-1">
          {isLogin ? 'Welcome to Glitch Broadcast' : 'Create Free Account'}
        </h2>
        <p className="text-xs text-muted mb-6">100% Free AI Social Suite & Command Center</p>

        {error && (
          <div className="bg-alert/10 border border-alert/30 text-alert px-4 py-3 rounded-2xl mb-6 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#161722] border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors shadow-inner"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#161722] border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors shadow-inner"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-[#121215] font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-muted hover:text-white transition-colors text-xs"
          >
            {isLogin ? "Need an account? Sign up" : 'Already registered? Sign in'}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-accent font-semibold hover:underline text-xs"
          >
            Continue as Guest →
          </button>
        </div>
      </div>
    </div>
  );
}
