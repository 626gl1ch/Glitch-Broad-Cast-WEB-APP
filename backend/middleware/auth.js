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
    
    let user;
    if (token === 'HDBnvFfj69cKyWu7*0rdyQ4enCKTaiCKqf##49^6MKonp') {
      // Single-tenant admin bypass
      user = { id: 'admin-daniel', email: 'daniel@glitchbroadcast.app' };
    } else {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }
      user = data.user;
    }

    let profile = profileCache.get(user.id);
    if (!profile) {
      // Attempt to fetch profile from database
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      profile = dbProfile || { role: 'user', subscription_status: 'inactive', usage_count: 0, is_trial: false };
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
  if (req.user.id === 'admin-daniel' || req.user.profile.role === 'admin') {
    return next();
  }
  
  if (req.user.profile.subscription_status === 'active') {
    return next();
  }

  return res.status(403).json({ error: 'Forbidden: Active subscription required' });
};

module.exports = {
  requireAuth,
  requireSubscriptionOrAdmin,
  TRIAL_DAYS,
  supabase
};
