import { createClient } from '@supabase/supabase-js';

// Supabase Environment variables or localStorage config
const getStoredSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('qr_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const key = localStorage.getItem('qr_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    return { url, key };
  } catch (e) {
    return { url: '', key: '' };
  }
};

const config = getStoredSupabaseConfig();

export const isSupabaseConfigured = () => {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && url.startsWith('http') && key.length > 20);
};

export const createSupabaseInstance = () => {
  const { url, key } = getStoredSupabaseConfig();
  if (isSupabaseConfigured()) {
    return createClient(url, key);
  }
  return null;
};

export let supabase = createSupabaseInstance();

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('qr_supabase_url', url.trim());
    localStorage.setItem('qr_supabase_anon_key', key.trim());
  } else {
    localStorage.removeItem('qr_supabase_url');
    localStorage.removeItem('qr_supabase_anon_key');
  }
  supabase = createSupabaseInstance();
};
