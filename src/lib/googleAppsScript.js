import { getGoogleDriveFileId, getGoogleDriveImageUrl } from './imageUrl';

const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';
const MAX_IMAGE_DIMENSION = 4000;
const JPEG_QUALITY = 0.92;

async function compressImage(file) {
  if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
    throw new Error('يجب اختيار ملف صورة صالح');
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    console.error('Could not decode the selected image:', error);
    throw new Error('تعذر قراءة ملف الصورة المحدد');
  }

  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة للرفع');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('تعذر ضغط الصورة للرفع'));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    });

    const baseName = file.name.replace(/\.[^.]*$/, '') || 'image';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('تعذر تجهيز الصورة للإرسال'));
        return;
      }
      const separator = reader.result.indexOf(',');
      if (separator < 0) {
        reject(new Error('تعذر تجهيز الصورة للإرسال'));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة الصورة'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToGoogleAppsScript(file) {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    throw new Error('لم يتم إعداد VITE_GOOGLE_APPS_SCRIPT_URL');
  }

  const compressedFile = await compressImage(file);
  const base64 = await fileToBase64(compressedFile);
  const payload = {
    fileName: compressedFile.name,
    mimeType: compressedFile.type,
    base64Data: base64,
  };

  let response;
  try {
    response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Google Apps Script upload request failed:', error);
    throw new Error('تعذر الاتصال بخدمة رفع الصور. تحقق من رابط Apps Script وإعدادات النشر.');
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error('Google Apps Script returned a non-JSON response:', error);
    throw new Error(`استجابة خدمة رفع الصور غير صالحة (${response.status})`);
  }

  if (!response.ok || result?.success !== true) {
    console.error('Google Apps Script upload failed:', result);
    throw new Error(result?.error || `فشل رفع الصورة (${response.status})`);
  }

  if (
    typeof result.fileId !== 'string' ||
    !/^[a-zA-Z0-9_-]+$/.test(result.fileId) ||
    typeof result.imageUrl !== 'string'
  ) {
    console.error('Google Apps Script response is missing a valid fileId or imageUrl:', result);
    throw new Error('لم تُرجع خدمة رفع الصور معرّف الملف ورابط الصورة المطلوبين');
  }

  const returnedFileId = getGoogleDriveFileId(result.imageUrl);
  if (returnedFileId !== result.fileId) {
    console.error('Google Apps Script returned a Drive URL that does not match its fileId:', result);
    throw new Error('رابط الصورة المعاد من Apps Script لا يطابق معرّف الملف');
  }

  return {
    ...result,
    imageUrl: getGoogleDriveImageUrl(result.imageUrl),
  };
}
