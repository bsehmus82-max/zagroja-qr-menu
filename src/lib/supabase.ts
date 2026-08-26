import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pxgnqbeklzorlhrhbluj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3PUM74SygM7pmyZMNh0l1g_Lf0Kq-s9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => true;

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu_images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('menu_images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
};
