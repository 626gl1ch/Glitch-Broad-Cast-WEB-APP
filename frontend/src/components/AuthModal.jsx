import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, User, Mail, CreditCard, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { api } from '../api';

export default function AuthModal({ session, setSession }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for stored session
  useEffect(() => {
    const storedSession = localStorage.getItem("glitch_user_session");
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        setSession(parsed);
      } catch (e) {}
    }
  }, [setSession]);

  if (session) return null;

  const handleAdminBypass = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password === 'HDBnvFfj69cKyWu7*0rdyQ4enCKTaiCKqf##49^6MKonp') {
      const localUser = {
        user: {
          id: "admin-daniel",
          email: "daniel@glitchbroadcast.app",
        },
        access_token: password, // backend expects this to bypass
        is_local: true
      };
      localStorage.setItem("glitch_user_session", JSON.stringify(localUser));
      localStorage.setItem("supabase_jwt", localUser.access_token);
      setSession(localUser);
    } else {
      setError('Incorrect master password.');
    }
    setLoading(false);
  };

  const checkSubscription = async (token, user) => {
    try {
      localStorage.setItem("supabase_jwt", token); // temp store to allow api call
      const me = await api.getMe();
      if (me.profile && me.profile.subscription_status === 'active') {
        const authUser = { user, access_token: token };
        localStorage.setItem("glitch_user_session", JSON.stringify(authUser));
        setSession(authUser);
      } else {
        // Init Checkout
        const checkout = await api.initializeCheckout();
        if (checkout && checkout.authorization_url) {
          window.location.href = checkout.authorization_url;
        } else {
          setError('Please complete payment to access the app.');
        }
      }
    } catch (err) {
      setError(err.message || "Failed to verify subscription.");
    }
  };

  const handleSupabaseAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.session) {
          await checkSubscription(data.session.access_token, data.user);
        } else {
          setError('Check your email to verify your account.');
        }
      } else if (activeTab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        await checkSubscription(data.session.access_token, data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-[#101014] border border-white/10 p-8 rounded-[32px] max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-accent-gradient" />
        
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent flex items-center gap-1.5 font-bold">
            <Lock size={12} /> Restricted Access
          </span>
        </div>

        <h2 className="text-2xl font-bold font-display text-white mb-2 tracking-tight">
          Glitch Broadcast
        </h2>
        <p className="text-xs text-muted mb-6 leading-relaxed">
          {activeTab === 'admin' 
            ? "Enter the master access password to initialize the Command Center."
            : "Sign in or create an account to access the platform. Access fee is $10."}
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-[#161722] rounded-xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'login' ? 'bg-surface border border-white/10 text-white shadow-md' : 'text-muted hover:text-white/80'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'signup' ? 'bg-surface border border-white/10 text-white shadow-md' : 'text-muted hover:text-white/80'}`}
          >
            Sign Up
          </button>
          <button 
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'admin' ? 'bg-accent/20 border border-accent/30 text-accent shadow-md' : 'text-muted hover:text-accent/80'}`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={activeTab === 'admin' ? handleAdminBypass : handleSupabaseAuth} className="space-y-4">
          
          {activeTab !== 'admin' && (
            <div>
              <label className="block text-[11px] font-mono text-muted uppercase mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full bg-[#161722] border border-white/5 text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors shadow-inner"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-muted uppercase mb-1.5 ml-1">
              {activeTab === 'admin' ? 'Master Password' : 'Password'}
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161722] border border-white/5 text-white rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors shadow-inner font-sans"
                required
              />
            </div>
          </div>

          {error && <p className="text-alert text-xs ml-1 bg-alert/10 border border-alert/20 p-2 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2 ${
              activeTab === 'admin' 
                ? 'bg-accent text-[#121215]' 
                : 'bg-white text-black'
            }`}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{activeTab === 'admin' ? 'Unlock System' : (activeTab === 'signup' ? 'Pay $10 & Create Account' : 'Login')}</span>
                {activeTab === 'admin' ? <ArrowRight size={16} /> : <CreditCard size={16} />}
              </>
            )}
          </button>
          
          {activeTab !== 'admin' && (
            <p className="text-center text-[10px] text-muted pt-2">
              By continuing, you agree to our Terms of Service. Secure payments via Paystack.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
