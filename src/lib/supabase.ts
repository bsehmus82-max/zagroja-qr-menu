import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pxgnqbeklzorlhrhbluj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3PUM74SygM7pmyZMNh0l1g_Lf0Kq-s9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

