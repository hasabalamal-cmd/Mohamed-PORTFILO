# MFM PHOTOGRAPHY - PORTFOLIO & CMS

موقع Portfolio متكامل وعصري للمصور الفوتوغرافي MFM، بالألوان الداكنة والذهبية الفاخرة (#d4a55e)، مع نظام إدارة محتوى كامل (لوحة تحكم Admin)، وقاعدة بيانات **Supabase (PostgreSQL)**، ونظام رفع وحفظ الصور السحابي عبر **Google Drive API** باستخدام **Netlify Serverless Functions**.

---

## 📸 الميزات الرئيسية للتصميم (مطابق للتصميم الأصلي 100%)

1. **Header (مثبّت أعلى الصفحة)**: شعار الكاميرا الأيقوني + MFM PHOTOGRAPHER، روابط التنقل، قوائم منسدلة، مبدّل اللغة، أيقونة بحث تعمل فعليًا، وزر الحجز/الدخول للوحة التحكم.
2. **Hero Section**: عنوان بخط سريف عريض مع لمسة ذهبية مائلة (*Forever*)، وصف، أزرار CTA (View Portfolio / Book a Session)، وشريط ترقيم السلايدر (01 —— 02 — 03).
3. **Photography Portfolio (شبكة 2 صفوف × 3 أعمدة)**:
   - بطاقات صور تفاعلية للأعمال: Weddings, Portraits, Landscapes, Newborn, Architecture, Products.
   - عدد صور كل مشروع على البطاقة، والبطاقة بالكامل رابط يفتح **معرض المشروع الاحترافي**.
4. **All Works Page** (`#/works`): أرشيف الأعمال — مسار تنقل، شريط فلاتر لاصق (بحث + ترتيب + حجم الشبكة + تصنيفات)، شبكة بطاقات مع Skeleton أثناء التحميل، زر «عرض المزيد»، وحالة فراغ مع إزالة الفلاتر.
5. **Project Gallery Viewer** (`#/project/<id>`): معرض صور احترافي لكل مشروع — شريط تقدّم، عدّاد، أدوات (تكبير/تصغير، شبكة كل الصور، مشاركة، الحجم الكامل، إغلاق)، سحب باللمس (Swipe) مع Pinch-zoom ونقرة مزدوجة للتكبير، أسهم ولوحة صور مصغرة قابلة للتمرير، اختصارات لوحة المفاتيح (← → / G / Esc)، وتعميق الرابط (Deep Link) قابل للمشاركة.
6. **About Section**:
   - صورة رئيسية عريضة لقسم «من نحن».
   - نبذة تعريفية وتوقيع المصور MFM.
   - 3 إحصائيات بأيقونات دقيقة (10+ Years Experience, 850+ Happy Clients, 1500+ Projects Completed).
7. **Studio Equipment**: قسم مخصص لعرض معدات وكاميرات وعدسات الاستوديو المحفوظة في قاعدة البيانات.
8. **Footer**: مقسم إلى 4 أعمدة (شعار وسوشيال ميديا، اشتراك Newsletter، روابط سريعة، وبيانات تواصل) وسطر Copyright كامل.

---

## 🧭 المسارات (Hash Router)

| المسار | الوصف |
| --- | --- |
| `#home` / `#about` / `#portfolio` / `#equipment` / `#contact` | الصفحة الرئيسية والتنقل بين الأقسام |
| `#/works` | صفحة «جميع الأعمال» |
| `#/works?cat=<categoryId>&q=<search>` | نفس الصفحة مع فلترة تصنيف/بحث (تُستخدم من القائمة المنسدلة وزر البحث) |
| `#/project/<projectId>` | معرض صور المشروع (طبقة كاملة مع إمكانية المشاركة كرابط مباشر) |

> التوجيه يعتمد على `hashchange` بدون أي مكتبة توجيه إضافية، ويعمل مع زر الرجوع في المتصفح (`location.replace` عند الإغلاق لتجنّب تكرار السجل).

---

## 🗄️ 1. قاعدة البيانات (Supabase Database Schema)

الملف الكامل موجود في: [`supabase_schema.sql`](file:///d:/MOHMMED/supabase_schema.sql).

### الجداول المُنشأة:
- **`categories`**: تصنيفات المشاريع (`id UUID PK`, `name TEXT`, `created_at TIMESTAMPTZ`).
- **`projects`**: المشاريع الأساسية (`id UUID PK`, `name TEXT`, `cover_image TEXT`, `category_id UUID FK`).
  - يرتبط مع التصنيفات عبر `ON DELETE RESTRICT` لمنع حذف أي تصنيف مرتبط بمشاريع.
- **`project_images`**: صور المعرض الإضافية لكل مشروع (`id UUID PK`, `project_id UUID FK`, `image_url TEXT`, `sort_order INT`).
  - يرتبط مع المشاريع عبر `ON DELETE CASCADE` لحذف الصور تلقائياً عند حذف المشروع.
- **`equipment`**: معدات الاستوديو والكاميرات (`id UUID PK`, `name TEXT`, `model TEXT`, `image_url TEXT`).

### الفهارس (Indexes):
- `idx_projects_category_id`
- `idx_project_images_project_id`
- `idx_project_images_sort_order`
- `idx_projects_created_at`, `idx_categories_created_at`, `idx_equipment_created_at`

### سياسات الأمان (Row Level Security - RLS):
- **قراءة فقط (SELECT)** متاحة للعامة والزوار (`anon` / `authenticated`).
- **تعديل / إضافة / حذف (INSERT, UPDATE, DELETE)** مقيد للمستخدمين المصادق عليهم (`authenticated`).

---

## ☁️ 2. نظام رفع وتخزين الصور (Google Apps Script Flow)

مسار رفع الصور المستخدم من لوحة الإدارة:
```text
Frontend (React) ──> ضغط JPEG ──> Google Apps Script Web App ──> Google Drive ──> رابط الصورة ──> Supabase
```

- يضغط المتصفح الصور بصيغة JPEG (حد أقصى 4000×4000، جودة 0.92) ثم يرسل JSON يحتوي `fileName` و`mimeType` و`base64Data` إلى رابط Apps Script المحدد في `VITE_GOOGLE_APPS_SCRIPT_URL`.
- يستقبل Apps Script بيانات Base64 المؤقتة ويرفع الملف إلى Google Drive؛ لا تُحفظ بيانات Base64 في Supabase.
- تحفظ قاعدة البيانات رابط الصورة فقط، ويُحوّل رابط Google Drive إلى رابط عرض مباشر عند عرضه في الموقع.
- دالة Netlify القديمة `netlify/functions/upload-to-drive.mjs` وبيانات Service Account ما زالت موجودة كمسار قديم، لكنها لم تعد مستخدمة من لوحة الإدارة.
- يتم تخزين الرابط النصي فقط في Supabase (`cover_image` / `image_url`).

---

## 🎛️ 3. لوحة التحكم الإدارية (Admin Dashboard)

يمكن الدخول للوحة التحكم مباشرة بالضغط على **Admin Portal** في الشريط العلوي أو الفوتر:
1. **إدارة المشاريع**:
   - عرض جدول بجميع المشاريع وصور أغلفتها وتصنيفاتها.
   - إضافة مشروع جديد، وتحديد تصنيفه، ورفع صورة الغلاف عبر Google Drive.
   - **الانتقال التلقائي الفوري بعد حفظ المشروع إلى صفحة إدارة صور المعرض** لرفع مجموعة صور له.
   - تعديل أو حذف المشروع (مع الحذف التلقائي لكافة صوره).
2. **إدارة صور المشروع**:
   - إمكانية رفع عدة صور في آن واحد عبر الـ Dropzone.
   - إعادة ترتيب أسبقية الصور (`sort_order`) بواسطة أزرار الأسهم لأعلى ولأسفل.
   - معاينة الصور وحذف أي صورة فردية.
3. **إدارة التصنيفات**:
   - إضافة وتعديل أسماء التصنيفات.
   - منع حذف أي تصنيف إذا كانت هناك مشاريع مرتبطة به مع إظهار التنبيه الواضح:
     > *"لا يمكن حذف هذا التصنيف لأنه مرتبط بمشاريع."*
4. **إدارة المعدات**:
   - إضافة وتعديل وحذف كاميرات وعدسات ومعدات الاستوديو مع صورها ومواصفاتها.
5. **شاشة حالة الاتصال**:
   - التحقق من اتصال قاعدة البيانات وحالة مفاتيح Netlify و Google Drive.

---

## 🚀 4. خطوات التشغيل والنشر (Setup & Deployment)

### أ) التشغيل المحلي (Local Development):
1. قم بتثبيت الحزم:
   ```bash
   npm install
   ```
2. أنشئ ملف `.env` بنسخ محتويات [`.env.example`](file:///d:/MOHMMED/.env.example):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```
3. شغل خادم التطوير:
   ```bash
   npm run dev
   ```

### ب) النشر على Netlify:
1. ارفع المشروع إلى مستودع GitHub الخاص بك.
2. في موقع **Netlify** اختر **Add new site** -> **Import an existing project**.
3. في إعدادات البناء (Build Settings):
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (تم ضبطها تلقائياً في `netlify.toml`).
4. في **Site configuration -> Environment variables**، أضف المتغيرات:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_APPS_SCRIPT_URL` (رابط Web App المنشور المنتهي بـ `/exec`)
5. اضغط **Deploy Site**!
