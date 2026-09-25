# LENSO PHOTOGRAPHY - PORTFOLIO & CMS

موقع Portfolio متكامل وعصري لمصور فوتوغرافي، مطابق تماماً لقالب وتصميم **Lenso Photography** بالألوان الداكنة والذهبية الفاخرة (#d4a55e)، مع نظام إدارة محتوى كامل (لوحة تحكم Admin)، وقاعدة بيانات **Supabase (PostgreSQL)**، ونظام رفع وحفظ الصور السحابي عبر **Google Drive API** باستخدام **Netlify Serverless Functions**.

---

## 📸 الميزات الرئيسية للتصميم (مطابق للتصميم الأصلي 100%)

1. **Header (مثبّت أعلى الصفحة)**: شعار الكاميرا الأيقوني + LENSO PHOTOGRAPHY، روابط التنقل، قوائم منسدلة، مبدّل اللغة، أيقونة بحث تعمل فعليًا، وزر الحجز/الدخول للوحة التحكم.
2. **Hero Section**: عنوان بخط سريف عريض مع لمسة ذهبية مائلة (*Forever*)، وصف، أزرار CTA (View Portfolio / Book a Session)، وشريط ترقيم السلايدر (01 —— 02 — 03).
3. **Features Bar**: 4 عناصر مع أيقونات أنيقة (Professional Quality, Experienced Team, On-Time Delivery, Worldwide Service).
4. **Photography Portfolio (شبكة 2 صفوف × 3 أعمدة)**:
   - بطاقات صور تفاعلية للأعمال: Weddings, Portraits, Landscapes, Newborn, Architecture, Products.
   - عدد صور كل مشروع على البطاقة، والبطاقة بالكامل رابط يفتح **معرض المشروع الاحترافي**.
5. **All Works Page** (`#/works`): أرشيف كامل باحترافية — Hero مع إحصائيات (مشاريع/تصنيفات/صور)، شريط فلاتر لاصق (بحث + ترتيب + حجم الشبكة + تصنيفات)، شبكة بطاقات مع Skeleton أثناء التحميل، زر «عرض المزيد»، وحالة فراغ مع إزالة الفلاتر.
6. **Project Gallery Viewer** (`#/project/<id>`): معرض صور احترافي لكل مشروع — شريط تقدّم، عدّاد، أدوات (تكبير/تصغير، شبكة كل الصور، مشاركة، الحجم الكامل، إغلاق)، سحب باللمس (Swipe) مع Pinch-zoom ونقرة مزدوجة للتكبير، أسهم ولوحة صور مصغرة قابلة للتمرير، اختصارات لوحة المفاتيح (← → / G / Esc)، وتعميق الرابط (Deep Link) قابل للمشاركة.
7. **About Section**:
   - صورتان متراكبتان للمصور ومعدات التصوير مع بادج عائم "🏆 120+ Awards Won".
   - نبذة تعريفية وتوقيع المؤسس (James Carter, Founder, Lenso Photography).
   - 3 إحصائيات بأيقونات دقيقة (10+ Years Experience, 850+ Happy Clients, 1500+ Projects Completed).
8. **Studio Equipment**: قسم مخصص لعرض معدات وكاميرات وعدسات الاستوديو المحفوظة في قاعدة البيانات.
9. **Testimonials Section**: خلفية غامقة مع بطاقات آراء العملاء وعلامات تنصيص ذهبية وصور دائرية (كل الآراء تظهر على الجوال والتابلت).
10. **Footer**: مقسم إلى 5 أعمدة (شعار وسوشيال ميديا، اشتراك Newsletter، روابط سريعة، خدمات، وبيانات تواصل) وسطر Copyright كامل.

---

## 🧭 المسارات (Hash Router)

| المسار | الوصف |
| --- | --- |
| `#home` / `#about` / `#features` / `#portfolio` / `#equipment` / `#testimonials` / `#contact` | الصفحة الرئيسية والتنقل بين الأقسام |
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

## ☁️ 2. نظام رفع وتخزين الصور (Google Drive Flow)

المسار الأمني الصارم:
```text
Frontend (React) ──> Netlify Function ──> Google Drive API ──> رفع الصورة وحفظ الرابط ──> Supabase
```

- الملف التنفيذي: [`netlify/functions/upload-to-drive.js`](file:///d:/MOHMMED/netlify/functions/upload-to-drive.js).
- يتم إرسال الصورة المشفرة Base64 من المتصفح إلى Netlify Function (Server-Side).
- تقوم الدالة بالاتصال بـ Google Drive API v3 عبر **Service Account** (أو OAuth2 Refresh Token) بصلاحيات سرية على الخادم دون تسريب أي مفاتيح للمتصفح.
- يتم إعداد إذن الملف ليصبح قابلاً للعرض العام وتوليد رابط Google CDN مباشر وسريع:
  `https://lh3.googleusercontent.com/d/{FILE_ID}`
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
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_FOLDER_ID`
5. اضغط **Deploy Site**!
