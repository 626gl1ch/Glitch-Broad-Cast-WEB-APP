import React, { useState } from 'react';
import { MessageSquare, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function FeedbackModal({ isOpen, onClose }) {
  const [feedbackType, setFeedbackType] = useState('bug');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.submitFeedback({ type: feedbackType, message });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-[#121215] border border-white/10 rounded-[24px] max-w-md w-full p-6 relative overflow-hidden shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors bg-white/5 rounded-full p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-accent/10 text-accent rounded-xl border border-accent/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white tracking-wide">Submit Feedback</h3>
            <p className="text-[10px] text-muted">Help us improve Glitch Broadcast</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="text-green-400 bg-green-400/10 p-4 rounded-full">
              <CheckCircle size={32} />
            </div>
            <p className="text-white font-bold">Feedback Submitted!</p>
            <p className="text-xs text-muted">Thank you for your input.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-muted uppercase mb-1.5 ml-1">Type of Feedback</label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full bg-[#161722] border border-white/5 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 transition-colors"
              >
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="general">General Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-muted uppercase mb-1.5 ml-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                className="w-full bg-[#161722] border border-white/5 text-white rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:border-accent/50 transition-colors"
                required
              />
            </div>

            {error && (
              <div className="bg-alert/10 border border-alert/20 text-alert p-3 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-[#121215] font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? 'Submitting...' : 'Send Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
