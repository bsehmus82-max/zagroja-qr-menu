import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://pxgnqbeklzorlhrhbluj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_3PUM74SygM7pmyZMNh0l1g_Lf0Kq-s9';

export const getSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('qr_supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem('qr_supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    return { url, key };
  } catch {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
  }
};

let currentClient: SupabaseClient = createClient(getSupabaseConfig().url, getSupabaseConfig().key);

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (currentClient as any)[prop];
  }
});

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url && key) {
    localStorage.setItem('qr_supabase_url', url.trim());
    localStorage.setItem('qr_supabase_anon_key', key.trim());
  } else {
    localStorage.removeItem('qr_supabase_url');
    localStorage.removeItem('qr_supabase_anon_key');
  }
  const config = getSupabaseConfig();
  currentClient = createClient(config.url, config.key);
};

export const testSupabaseConnection = async (testUrl?: string, testKey?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const targetUrl = testUrl || getSupabaseConfig().url;
    const targetKey = testKey || getSupabaseConfig().key;
    const client = createClient(targetUrl, targetKey);
    const { error } = await client.from('restaurants').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Bağlantı kurulamadı' };
  }
};

export const isSupabaseConfigured = () => true;

const compressFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!file.type.startsWith('image/')) {
        resolve(result);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export const uploadImage = async (file: File): Promise<{ url: string | null; error?: string }> => {
  try {
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

    if (!uploadError) {
      const { data } = supabase.storage.from('menu_images').getPublicUrl(filePath);
      if (data?.publicUrl) {
        return { url: data.publicUrl };
      }
    }

    // Fallback: If storage upload fails, compress and return Data URL directly
    console.warn('Storage upload fallback activated:', uploadError);
    const dataUrl = await compressFileToDataUrl(file);
    if (dataUrl) {
      return { url: dataUrl };
    }

    return { url: null, error: uploadError?.message || 'Görsel işlenemedi' };
  } catch (error: any) {
    console.warn('uploadImage error, using dataUrl fallback:', error);
    try {
      const dataUrl = await compressFileToDataUrl(file);
      if (dataUrl) {
        return { url: dataUrl };
      }
    } catch {
      // ignore
    }
    return { url: null, error: error?.message || 'Bilinmeyen hata' };
  }
};

