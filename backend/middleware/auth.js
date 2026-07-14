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
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    let profile = profileCache.get(user.id);
    if (!profile) {
      // Attempt to fetch profile from database
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      profile = dbProfile || { role: 'user', subscription_status: 'active', usage_count: 0, is_trial: false };
      profileCache.set(user.id, profile);
    }

    req.user = {
      ...user,
      profile
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Server error during authentication' });
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
