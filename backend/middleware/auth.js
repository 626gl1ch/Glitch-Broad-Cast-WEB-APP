const { createClient } = require('@supabase/supabase-js');
const { LRUCache } = require('lru-cache');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mdmpcxtjwnovbhidwwhj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey);

const TRIAL_DAYS = 36500; // Unlimited free mode

// Cache profiles
const profileCache = new LRUCache({
  max: 5000,
  ttl: 1000 * 60 * 5,
});

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Allow seamless guest/demo session for 100% free web app if auth header not passed
      req.user = {
        id: 'free-web-user',
        email: 'user@glitchbroadcast.app',
        profile: { role: 'admin', subscription_status: 'active', usage_count: 0, is_trial: false }
      };
      return next();
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = {
        id: 'free-web-user',
        email: 'user@glitchbroadcast.app',
        profile: { role: 'admin', subscription_status: 'active', usage_count: 0, is_trial: false }
      };
      return next();
    }

    let profile = profileCache.get(user.id);
    if (!profile) {
      profile = { role: 'admin', subscription_status: 'active', usage_count: 0, is_trial: false };
      profileCache.set(user.id, profile);
    }

    req.user = {
      ...user,
      profile: { ...profile, role: 'admin', subscription_status: 'active', is_trial: false }
    };

    next();
  } catch (error) {
    req.user = {
      id: 'free-web-user',
      email: 'user@glitchbroadcast.app',
      profile: { role: 'admin', subscription_status: 'active', usage_count: 0, is_trial: false }
    };
    next();
  }
};

const requireSubscriptionOrAdmin = (req, res, next) => {
  // 100% Free & Unlimited - Always pass
  next();
};

module.exports = {
  requireAuth,
  requireSubscriptionOrAdmin,
  TRIAL_DAYS,
  supabase
};
