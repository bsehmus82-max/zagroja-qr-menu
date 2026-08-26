import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pxgnqbeklzorlhrhbluj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3PUM74SygM7pmyZMNh0l1g_Lf0Kq-s9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => true;
