import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pxgnqbeklzorlhrhbluj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3PUM74SygM7pmyZMNh0l1g_Lf0Kq-s9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = () => true;

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    // Accept any image format - no restriction on type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(fileExt)
      ? fileExt
      : 'jpg';

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${safeExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `image/${safeExt}`,
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      alert(`Yükleme hatası: ${uploadError.message}`);
      return null;
    }

    const { data } = supabase.storage.from('menu_images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error: any) {
    console.error('Error in uploadImage:', error);
    alert(`Beklenmeyen hata: ${error?.message || 'Bilinmeyen hata'}`);
    return null;
  }
};
