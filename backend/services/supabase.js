const { createClient } = require("@supabase/supabase-js");

const getSupabase = (req) => {
  const url = req?.user?.profile?.settings?.SUPABASE_URL || process.env.SUPABASE_URL;
  const key = req?.user?.profile?.settings?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase credentials in settings or environment variables.");
  }
  
  return createClient(url, key);
};

module.exports = { getSupabase };
