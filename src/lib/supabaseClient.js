import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_CATEGORIES,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_IMAGES,
  INITIAL_EQUIPMENT,
} from './initialSeed';
import { normalizeImageUrl } from './imageUrl';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Validate if real Supabase keys are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabasePublishableKey.includes('your_publishable_key')
);
console.log('[Supabase Config]', {
  url: supabaseUrl,
  hasKey: Boolean(supabasePublishableKey),
  isConfigured: isSupabaseConfigured,
});
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

// Local storage fallback helpers for smooth testing & standalone demonstration
const STORAGE_KEYS = {
  CATEGORIES: 'lenso_categories',
  PROJECTS: 'lenso_projects',
  PROJECT_IMAGES: 'lenso_project_images',
  EQUIPMENT: 'lenso_equipment',
};

const getLocal = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setLocal = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error', e);
  }
};

// Initialize local seed data if not present
if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
  setLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}
if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
  setLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
}
if (!localStorage.getItem(STORAGE_KEYS.PROJECT_IMAGES)) {
  setLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
}
if (!localStorage.getItem(STORAGE_KEYS.EQUIPMENT)) {
  setLocal(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
}

// ============================================================================
// CATEGORIES REPOSITORY
// ============================================================================
export async function getCategories() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  return getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export async function createCategory(name) {
  if (!name || !name.trim()) throw new Error('اسم التصنيف مطلوب');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: name.trim() }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const newItem = {
    id: 'cat-' + Date.now(),
    name: name.trim(),
    created_at: new Date().toISOString(),
  };
  setLocal(STORAGE_KEYS.CATEGORIES, [newItem, ...items]);
  return newItem;
}

export async function updateCategory(id, name) {
  if (!name || !name.trim()) throw new Error('اسم التصنيف مطلوب');

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const updated = items.map((item) =>
    item.id === id ? { ...item, name: name.trim() } : item
  );
  setLocal(STORAGE_KEYS.CATEGORIES, updated);
  return updated.find((i) => i.id === id);
}

export async function deleteCategory(id) {
  // RULE ENFORCEMENT:
  // لا يمكن حذف تصنيف (category) مرتبط بأي مشروع؛ يجب عرض رسالة خطأ واضحة:
  // "لا يمكن حذف هذا التصنيف لأنه مرتبط بمشاريع."
  const projects = await getProjects();
  const linkedProjects = projects.filter((p) => p.category_id === id);

  if (linkedProjects.length > 0) {
    throw new Error('لا يمكن حذف هذا التصنيف لأنه مرتبط بمشاريع.');
  }

  if (isSupabaseConfigured) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  const items = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const filtered = items.filter((item) => item.id !== id);
  setLocal(STORAGE_KEYS.CATEGORIES, filtered);
  return true;
}

// ============================================================================
// PROJECTS REPOSITORY
// ============================================================================
export async function getProjects(categoryId = null) {
  if (isSupabaseConfigured) {
    let query = supabase
      .from('projects')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (!error && data) {
      return data.map((item) => ({
        ...item,
        category_name: item.categories?.name || 'General',
      }));
    }
  }

  let projects = getLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const categories = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  
  projects = projects.map(p => {
    const cat = categories.find(c => c.id === p.category_id);
    return { ...p, category_name: cat ? cat.name : (p.category_name || 'General') };
  });

  if (categoryId && categoryId !== 'all') {
    return projects.filter((p) => p.category_id === categoryId);
  }
  return projects;
}

export async function getProjectById(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, categories(name)')
      .eq('id', id)
      .single();
    if (!error && data) {
      return {
        ...data,
        category_name: data.categories?.name || 'General',
      };
    }
  }

  const projects = await getProjects();
  return projects.find((p) => p.id === id) || null;
}

export async function createProject({ name, category_id, cover_image }) {
  if (!name || !name.trim()) throw new Error('اسم المشروع مطلوب');
  if (!category_id) throw new Error('يجب اختيار التصنيف');
  const normalizedCoverImage = cover_image ? normalizeImageUrl(cover_image) : null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: name.trim(),
          category_id,
          cover_image: normalizedCoverImage,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const categories = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const cat = categories.find((c) => c.id === category_id);

  const newProject = {
    id: 'proj-' + Date.now(),
    name: name.trim(),
    category_id,
    category_name: cat?.name || 'General',
    cover_image: normalizedCoverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    created_at: new Date().toISOString(),
  };

  setLocal(STORAGE_KEYS.PROJECTS, [newProject, ...items]);
  return newProject;
}

export async function updateProject(id, { name, category_id, cover_image }) {
  if (!name || !name.trim()) throw new Error('اسم المشروع مطلوب');
  if (!category_id) throw new Error('يجب اختيار التصنيف');
  const normalizedCoverImage = cover_image ? normalizeImageUrl(cover_image) : null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: name.trim(),
        category_id,
        cover_image: normalizedCoverImage,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const categories = getLocal(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const cat = categories.find((c) => c.id === category_id);

  const updated = items.map((item) =>
    item.id === id
      ? {
          ...item,
          name: name.trim(),
          category_id,
          category_name: cat?.name || item.category_name,
          cover_image: cover_image !== undefined ? normalizedCoverImage : item.cover_image,
        }
      : item
  );

  setLocal(STORAGE_KEYS.PROJECTS, updated);
  return updated.find((p) => p.id === id);
}

export async function deleteProject(id) {
  if (isSupabaseConfigured) {
    // ON DELETE CASCADE deletes project_images automatically
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  const items = getLocal(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const filtered = items.filter((p) => p.id !== id);
  setLocal(STORAGE_KEYS.PROJECTS, filtered);

  // Cascade delete images in local mode
  const images = getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
  setLocal(
    STORAGE_KEYS.PROJECT_IMAGES,
    images.filter((img) => img.project_id !== id)
  );

  return true;
}

// ============================================================================
// PROJECT IMAGES REPOSITORY
// ============================================================================
export async function getProjectImages(projectId) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (!error && data) return data;
  }

  const images = getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
  return images
    .filter((img) => img.project_id === projectId)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function getAllProjectImages() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('project_images')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) return data;
  }

  return getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
}

export async function addProjectImage({ project_id, image_url, sort_order = 0 }) {
  if (!project_id || !image_url) throw new Error('بيانات الصورة غير مكتملة');
  const normalizedImageUrl = normalizeImageUrl(image_url);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('project_images')
      .insert([{ project_id, image_url: normalizedImageUrl, sort_order }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const images = getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
  const newImg = {
    id: 'img-' + Date.now() + Math.random().toString(36).substr(2, 4),
    project_id,
    image_url: normalizedImageUrl,
    sort_order,
    created_at: new Date().toISOString(),
  };

  setLocal(STORAGE_KEYS.PROJECT_IMAGES, [...images, newImg]);
  return newImg;
}

export async function deleteProjectImage(imageId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('project_images')
      .delete()
      .eq('id', imageId);
    if (error) throw error;
    return true;
  }

  const images = getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
  setLocal(
    STORAGE_KEYS.PROJECT_IMAGES,
    images.filter((img) => img.id !== imageId)
  );
  return true;
}

export async function updateImageOrder(imageId, newSortOrder) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('project_images')
      .update({ sort_order: newSortOrder })
      .eq('id', imageId);
    if (error) throw error;
    return true;
  }

  const images = getLocal(STORAGE_KEYS.PROJECT_IMAGES, INITIAL_PROJECT_IMAGES);
  const updated = images.map((img) =>
    img.id === imageId ? { ...img, sort_order: newSortOrder } : img
  );
  setLocal(STORAGE_KEYS.PROJECT_IMAGES, updated);
  return true;
}

// ============================================================================
// EQUIPMENT REPOSITORY
// ============================================================================
export async function getEquipment() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  return getLocal(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
}

export async function createEquipment({ name, model, image_url }) {
  if (!name || !name.trim()) throw new Error('اسم المعدة مطلوب');
  const normalizedImageUrl = image_url ? normalizeImageUrl(image_url) : null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('equipment')
      .insert([{ name: name.trim(), model: model || null, image_url: normalizedImageUrl }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
  const newItem = {
    id: 'eq-' + Date.now(),
    name: name.trim(),
    model: model || '',
    image_url: normalizedImageUrl || '',
    created_at: new Date().toISOString(),
  };

  setLocal(STORAGE_KEYS.EQUIPMENT, [newItem, ...items]);
  return newItem;
}

export async function updateEquipment(id, { name, model, image_url }) {
  if (!name || !name.trim()) throw new Error('اسم المعدة مطلوب');
  const normalizedImageUrl = image_url ? normalizeImageUrl(image_url) : null;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('equipment')
      .update({ name: name.trim(), model: model || null, image_url: normalizedImageUrl })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const items = getLocal(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
  const updated = items.map((item) =>
    item.id === id ? { ...item, name: name.trim(), model, image_url: normalizedImageUrl || '' } : item
  );
  setLocal(STORAGE_KEYS.EQUIPMENT, updated);
  return updated.find((i) => i.id === id);
}

export async function deleteEquipment(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('equipment').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  const items = getLocal(STORAGE_KEYS.EQUIPMENT, INITIAL_EQUIPMENT);
  setLocal(
    STORAGE_KEYS.EQUIPMENT,
    items.filter((item) => item.id !== id)
  );
  return true;
}

// ============================================================================
// GOOGLE DRIVE UPLOAD VIA NETLIFY FUNCTION
// ============================================================================
const MAX_NETLIFY_IMAGE_SIZE = 4 * 1024 * 1024;

async function prepareImageForUpload(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('يجب اختيار ملف صورة صالح');
  }
  if (file.size <= MAX_NETLIFY_IMAGE_SIZE) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    console.error('Could not decode large image for upload:', error);
    throw new Error('تعذر تجهيز الصورة الكبيرة للرفع');
  }

  try {
    const canvas = document.createElement('canvas');
    const maxDimension = 2560;
    let scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
      canvas.height = Math.max(1, Math.floor(bitmap.height * scale));

      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز الصورة للرفع');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.86, 0.76, 0.66, 0.56]) {
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) resolve(result);
              else reject(new Error('تعذر ضغط الصورة للرفع'));
            },
            'image/webp',
            quality,
          );
        });

        if (blob.size <= MAX_NETLIFY_IMAGE_SIZE) {
          const extensionByType = {
            'image/webp': '.webp',
            'image/jpeg': '.jpg',
            'image/png': '.png',
          };
          const extension = extensionByType[blob.type];
          if (!extension) throw new Error('تعذر إنشاء نسخة صورة صالحة للرفع');
          const fileName = file.name.replace(/\.[^.]*$/, '') + extension;
          return new File([blob], fileName, {
            type: blob.type,
            lastModified: Date.now(),
          });
        }
      }

      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }

  throw new Error('تعذر ضغط الصورة إلى الحجم المسموح به للرفع');
}

export async function uploadImageToGoogleDrive(file, folderId = null) {
  if (!file) throw new Error('لم يتم تحديد أي ملف');
  const uploadFile = await prepareImageForUpload(file);

  const uploadEndpoint = '/.netlify/functions/upload-to-drive';
  const formData = new FormData();
  formData.append('file', uploadFile, uploadFile.name);
  if (folderId) formData.append('folderId', folderId);

  let response;
  try {
    response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Google Drive upload request failed:', error);
    throw new Error(`تعذر الاتصال بخدمة رفع Google Drive: ${error.message}`);
  }

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    if (response.status === 413) {
      throw new Error('الصورة أكبر من الحد المسموح به لخدمة الرفع. حاول اختيار صورة أصغر.');
    }
    throw new Error(
      `استجابة خدمة رفع Google Drive غير صالحة (${response.status})`,
    );
  }

  if (!response.ok) {
    console.error('Netlify function upload failed:', result);
    if (response.status === 413) {
      throw new Error('الصورة أكبر من الحد المسموح به لخدمة الرفع. حاول اختيار صورة أصغر.');
    }
    throw new Error(
      result?.error || `فشل رفع الصورة إلى Google Drive (${response.status})`,
    );
  }

  if (
    result?.success !== true ||
    typeof result.imageUrl !== 'string' ||
    typeof result.fileId !== 'string' ||
    !result.fileId
  ) {
    throw new Error(
      result?.error || 'لم تُرجع خدمة Google Drive رابطاً صالحاً للصورة',
    );
  }

  let imageUrl;
  try {
    imageUrl = new URL(result.imageUrl);
  } catch {
    throw new Error('أعادت خدمة Google Drive رابط صورة غير صالح');
  }

  if (
    imageUrl.protocol !== 'https:' ||
    !['lh3.googleusercontent.com', 'drive.google.com'].includes(imageUrl.hostname)
  ) {
    throw new Error('أعادت خدمة Google Drive رابطاً لا يشير إلى Google Drive');
  }

  return {
    success: true,
    imageUrl: imageUrl.href,
    fileId: result.fileId,
    source: 'google_drive',
  };
}
