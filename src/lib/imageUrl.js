const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com', 'www.drive.google.com']);

function getGoogleDriveFileId(url) {
  const pathFileId = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1];
  const fileId = pathFileId || url.searchParams.get('id');
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    throw new Error('رابط Google Drive لا يحتوي على معرّف ملف صالح');
  }
  return fileId;
}

export function normalizeGoogleDriveImageUrl(value) {
  const input = String(value || '').trim();
  if (!input) throw new Error('يرجى إدخال رابط الصورة');
  if (/^data:/i.test(input)) {
    throw new Error('لا يمكن حفظ صورة Base64. أدخل رابط صورة مباشر أو Google Drive');
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error('رابط الصورة غير صالح. أدخل رابطاً كاملاً يبدأ بـ https://');
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('يجب أن يكون رابط الصورة عاماً وآمناً باستخدام HTTP أو HTTPS');
  }

  if (GOOGLE_DRIVE_HOSTS.has(url.hostname.toLowerCase())) {
    const fileId = getGoogleDriveFileId(url);
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
  }

  return url.href;
}

export function getGoogleDriveImagePreviewFallback(value) {
  try {
    const normalizedUrl = new URL(normalizeGoogleDriveImageUrl(value));
    if (!GOOGLE_DRIVE_HOSTS.has(normalizedUrl.hostname.toLowerCase())) return '';

    const fileId = getGoogleDriveFileId(normalizedUrl);
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2000`;
  } catch {
    return '';
  }
}
