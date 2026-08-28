# Dros Math Universe — Color Tokens (Before Calm-Down Pass)

> **Snapshot taken**: قبل تعديل نظام الألوان لتهدئة الصبغة اللايم الفاقعة في الوضع الداكن وتنعيم الأخضر الزيتوني في الوضع الفاتح.
> **File**: `src/app/globals.css` (lines 12–128)
> **Purpose**: مرجع استعادة إذا احتجنا الرجوع للقيم الأصلية.

## 1. الوضع الفاتح (LIGHT MODE) — السطور 12–72

```css
:root,
[data-theme="light"],
html:not(.dark) {
  --bg: #F8F9FA;
  --background: #F8F9FA;
  --surface: #FFFFFF;
  --surface-elevated: #FFFFFF;
  --surface-secondary: #F1F3F5;
  --surface-2: #F1F3F5;
  --surface-3: #E9ECEF;

  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
  --ink: #0F172A;
  --ink-secondary: #334155;
  --muted: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --line: #E2E8F0;
  --line-strong: #CBD5E1;
  --line-soft: rgba(15, 23, 42, 0.06);

  --accent: #4D7C0F;
  --accent-strong: #3F6212;
  --accent-soft: #ECFCCB;

  --neon-lime: #4D7C0F;
  --neon-lime-bright: #65A30D;
  --neon-lime-glow: rgba(77, 124, 15, 0.2);
  --neon-lime-soft: #ECFCCB;

  --brand: #4D7C0F;
  --brand-strong: #3F6212;
  --brand-soft: #ECFCCB;
  --gold: #B45309;
  --gold-soft: #FEF3C7;

  --chrome: #0F172A;
  --gunmetal: #334155;
  --graphite: #64748B;

  --success: #15803D;
  --danger: #DC2626;
  --warning: #B45309;

  --grid-line: rgba(15, 23, 42, 0.05);
  --glass-bg: rgba(255, 255, 255, 0.9);
  --glass-border: #E2E8F0;
  --glass-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);

  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06);
  --shadow-lift: 0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 20px 40px -10px rgba(15, 23, 42, 0.05);
}
```

## 2. الوضع الداكن (DARK MODE) — السطور 74–128

```css
.dark,
[data-theme="dark"],
html.dark {
  --bg: #050505;
  --background: #050505;
  --surface: #0C0E10;
  --surface-elevated: #15181C;
  --surface-secondary: #15181C;
  --surface-2: #15181C;
  --surface-3: #1C2025;

  --text-primary: #FFFFFF;
  --text-secondary: #C8D1DC;
  --text-muted: #8E98A5;
  --ink: #FFFFFF;
  --ink-secondary: #C8D1DC;
  --muted: #8E98A5;

  --border: #22262E;
  --border-strong: #343940;
  --line: #22262E;
  --line-strong: #343940;
  --line-soft: rgba(255, 255, 255, 0.08);

  --accent: #B8FF00;
  --accent-strong: #86B800;
  --accent-soft: rgba(184, 255, 0, 0.15);
  --neon-lime: #B8FF00;
  --neon-lime-bright: #D7FF3F;
  --neon-lime-glow: rgba(184, 255, 0, 0.45);
  --neon-lime-soft: rgba(184, 255, 0, 0.15);

  --brand: #B8FF00;
  --brand-strong: #86B800;
  --brand-soft: rgba(184, 255, 0, 0.15);
  --gold: #B8FF00;
  --gold-soft: rgba(184, 255, 0, 0.15);

  --chrome: #F4F5F6;
  --gunmetal: #343940;
  --graphite: #15181C;

  --success: #B8FF00;
  --danger: #f87171;
  --warning: #B8FF00;

  --grid-line: rgba(184, 255, 0, 0.05);
  --glass-bg: rgba(12, 14, 16, 0.9);
  --glass-border: #22262E;
  --glass-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.85);

  --shadow-card: 0 2px 10px rgba(0, 0, 0, 0.2), 0 15px 30px -10px rgba(0, 0, 0, 0.5);
  --shadow-lift: 0 10px 30px -5px rgba(184, 255, 0, 0.15), 0 20px 45px -10px rgba(0, 0, 0, 0.6);
}
```

## 3. مشاكل هذا النظام (التي ستُحل بعد التعديل)

1. **اللايم فاقع جداً في الداكن**: `--brand: #B8FF00` (Hue 75°، Saturation 100%، Lightness 50%) — يتسبب في إرهاق بصري على خلفية `#050505` (نسبة التباين 17.4:1).
2. **4 ألوان دلالية تندمج في لون واحد**: في الوضع الداكن، `--brand` = `--gold` = `--success` = `--warning` = `#B8FF00`. لا يمكن التمييز بين "نشط" و"بريميوم" و"تحذير" و"براند".
3. **الزيتوني موحل في الفاتح**: `--brand: #4D7C0F` (Lightness 24%) يبدو داكناً جداً على الأبيض.
4. **الظلال المتوهجة**: `--shadow-lift` في الداكن يحتوي `rgba(184,255,0,0.15)` — كل سطح مرتفع يطلق توهجاً ليمياً.
5. **الشبكة التحتية ليماء**: `--grid-line: rgba(184, 255, 0, 0.05)` — كامل الصفحة مغمور بشبكة ليماء.

## 4. الاستخدام الكثيف (سيتأثر بالتغيير)

| الملف | عدد الاستخدامات التقريبي |
|---|---|
| `src/components/dros-universe-showcase.tsx` | 30+ |
| `src/components/interactive-courses-3d.tsx` | 15+ |
| `src/components/marketing.tsx` | 12+ |
| `src/components/compact-features-ticker.tsx` | 10+ |
| `src/components/admin-console.tsx` | 40+ |
| `src/components/admin/*.tsx` | 25+ |
| `src/components/hero-math-3d.tsx` | 8+ |
| `src/components/sidebar.tsx`, `topbar.tsx` | 5+ |

> **ملاحظة**: تعديل globals.css فقط سيؤثر على كل هذه الاستخدامات تلقائياً.
