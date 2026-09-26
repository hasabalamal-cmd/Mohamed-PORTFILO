// =========================
// Fix Private Key
// =========================

let rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY || "";

// إذا تم وضع كامل JSON الخاص بحساب الخدمة بالخطأ
try {
  if (rawPrivateKey.trim().startsWith("{")) {
    const parsed = JSON.parse(rawPrivateKey);

    if (parsed.private_key) {
      rawPrivateKey = parsed.private_key;
    }
  }
} catch (jsonError) {
  console.warn(
    "GOOGLE_PRIVATE_KEY is not valid JSON, continuing as PEM."
  );
}

// تنظيف المفتاح
const privateKey = rawPrivateKey
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\\n/g, "\n")
  .replace(/\r/g, "");

// فحص آمن بدون إظهار المفتاح
if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
  throw new Error(
    "GOOGLE_PRIVATE_KEY does not contain a valid BEGIN PRIVATE KEY header."
  );
}

if (!privateKey.includes("-----END PRIVATE KEY-----")) {
  throw new Error(
    "GOOGLE_PRIVATE_KEY does not contain a valid END PRIVATE KEY footer."
  );
}

// =========================
// Google Authentication
// =========================

const authClient = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: [
    "https://www.googleapis.com/auth/drive",
  ],
});
