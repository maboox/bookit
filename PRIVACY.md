# Privacy / حریم خصوصی

Bookit 2.0 stores saved article text, source URLs, author/title metadata, tags,
highlights, notes, questions, answers, reading position and preferences in
`chrome.storage.local` in your browser profile. It does not use cloud sync,
analytics, advertisements, accounts, remote scripts or a Bookit server.

## Page access and network requests

- `activeTab` and `scripting` allow extraction only after you invoke the extension
  and choose to read or save the current page. There is no automatic content
  script and no persistent host permission. The background worker never fetches
  pages. Your browser continues to make the source website's normal requests.
- Saved copies open in an extension page and use only bundled fonts, styles and
  scripts. Images, embeds and other remote resources are excluded from copies.
  This makes saved text available offline and avoids tracking pixels in the reader.
- Dictionary buttons open an external website only after you click its link.
  The selected word is included in that site's URL; its privacy policy applies.
- Opening an original source or the GitHub link similarly visits that website.
- Source URL credentials, fragments and common sensitive query parameters are
  removed. This is a heuristic, not a guarantee that an address or article contains
  no personal information. Do not save pages containing information you do not
  want in your local library.

## Local storage and backup files

Local data is not encrypted by Bookit. Anyone with access to your browser profile
or exported JSON may be able to read it. Backups contain full article text and
personal annotations; keep them private. No backup is uploaded by Bookit.
Restoring a backup validates all entries before writing, merges missing books and
replaces books with the same normalized URL and included preferences. Export first
if you want to preserve an older copy. Delete individual books in the library;
uninstalling the extension normally removes its local storage. Browser backups may
retain their own copies.

## Boundaries

The on-page reader uses a closed shadow root to reduce interference from a host
page. A shadow root is not a security boundary against a malicious website or
another installed extension. Prefer the saved copy in the extension's own reader
when writing private notes. Do not edit the same book in multiple readers at once:
the most recent save can replace an earlier edit. The library is limited by the
browser's local extension storage quota (normally 10 MB).

## فارسی

متن مقاله‌ها، نشانی منبع، عنوان و نویسنده، تگ‌ها، هایلایت‌ها، یادداشت‌ها،
پرسش و پاسخ، جای مطالعه و تنظیمات در پروفایل مرورگر شما ذخیره می‌شوند.
Bookit حساب کاربری، همگام‌سازی ابری، آمارگیری، تبلیغات یا سرور اختصاصی ندارد.
خواندن صفحه فقط با درخواست شما فعال می‌شود؛ دسترسی دائمی به همهٔ سایت‌ها ندارد.

نسخه ذخیره‌شده داخل افزونه باز می‌شود و تصویرها و منابع خارجی را بارگیری نمی‌کند.
برای معنی واژه، تنها پس از کلیک روی لینک واژه‌نامه، واژه به سایت مربوط ارسال می‌شود.
بازکردن منبع اصلی و گیت‌هاب هم قوانین حریم خصوصی همان سایت را دارد.

داده‌ها و فایل پشتیبان توسط Bookit رمزگذاری نمی‌شوند. فایل JSON شامل متن کامل،
نشانی منبع و یادداشت‌های شماست؛ آن را عمومی نکنید. بازیابی، کتاب‌های هم‌نشانی
و تنظیمات موجود در فایل را جایگزین می‌کند و کتاب‌های دیگر را نگه می‌دارد.
پیش از بازیابی از اطلاعات فعلی پشتیبان بگیرید. حذف کتاب از کتابخانه، اطلاعات
همان کتاب را پاک می‌کند. حذف افزونه معمولاً حافظهٔ محلی آن را هم حذف می‌کند.

حذف پارامترهای حساس نشانی، تشخیص کامل اطلاعات شخصی نیست. محتوای حساس را
ذخیره نکنید. برای یادداشت خصوصی از نسخه ذخیره‌شده در تب خود افزونه استفاده کنید؛
نمای روی سایت مرز امنیتی در برابر سایت مخرب نیست. هم‌زمان یک کتاب را در چند
پنجره ویرایش نکنید، زیرا ذخیره آخر می‌تواند ویرایش قبلی را جایگزین کند.
