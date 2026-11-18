# اكواد javascript الخاصه بالصفحات فقط

_@GRY KJ/2026/11/16/_

- theme-engine.js: محرك الثيمات المشترك (يحسب التباين تلقائي)
- themes-page.js: كود صفحة الثيمات الجديدة (ThemesPage.css للتنسيق)
- themes.js / Themes.css القديمة باقية لانو sginup.html بتستخدمها

- i18n.js: ترجمة يدوية ل5 لغات (ar en fr tr es) | languages-data.js: كل اللغات | language-page.js: صفحة اللغات الجديدة
- empty-cat.js: القطة المحققة (svg متحرك) بتظهر مكان البحث لمن مافي نتيجة في صفحة الثيمات واللغات (الابيض بيتبع الثيم والوردي ثابت)
- composer.js: مربع الكتابة في الداشبورد؛ يجهز محادثة جديدة بنفس مفاتيح chat.js (qulife_ai_chats / qulife_ai_chat_<id>) ثم يفتح chat.html ليرسلها للذكاء
- chat.js: يشمل الآن سجل السايدبار (بحث، تجميع بالتاريخ، حذف، عنوان تلقائي)
