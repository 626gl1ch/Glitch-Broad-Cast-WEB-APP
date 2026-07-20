import { createClient } from '@supabase/supabase-js';

// Retrieve keys from localStorage if available, or environment
const getKeys = () => {
  try {
    return JSON.parse(localStorage.getItem('glitch_keys') || '{}');
  } catch(e) {
    return {};
  }
};

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || getKeys().SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || getKeys().SUPABASE_ANON_KEY;

// You can fall back to the actual project keys or prompt the user if missing.
// For now, we will initialize with whatever we have.

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
);
