export interface MathSymbolData {
  readonly id: string;
  readonly label: string;
  readonly branch: string;
  readonly formula: string;
  readonly desc: string;
  readonly imageSrc: string;
  readonly glyph: string;
}

export const MATH_SYMBOLS_3D: MathSymbolData[] = [
  {
    id: "pi",
    label: "π — النسبة التقريبية",
    branch: "الهندسة وحساب المثلثات",
    formula: "A = πr²  ·  C = 2πr",
    desc: "ثابت الدائرة والتحويل الدائري والزوايا الموجهة",
    imageSrc: "/images/symbols/pi.png",
    glyph: "π",
  },
  {
    id: "sigma",
    label: "Σ — رمز المجموع",
    branch: "الجبر والمتتابعات",
    formula: "Sₙ = ∑ a · rⁿ⁻¹",
    desc: "المتسلسلات الحسابية والهندسية ومجموع المتتابعات",
    imageSrc: "/images/symbols/sigma.png",
    glyph: "Σ",
  },
  {
    id: "sqrt",
    label: "√ — الجذور والأعداد",
    branch: "الجبر والأعداد المركبة",
    formula: "z = x + iy = r(cos θ + i sin θ)",
    desc: "نظرية ديموافر والجذور التكعيبية للواحد الصحيح",
    imageSrc: "/images/symbols/sqrt.png",
    glyph: "√",
  },
  {
    id: "fx",
    label: "f(x) — الدوال والنهايات",
    branch: "التفاضل والدوال",
    formula: "lim [f(x) - f(a)] / (x - a)",
    desc: "دراسة سلوك المنحنيات والاطراد ونهايات الدوال",
    imageSrc: "/images/symbols/fx.png",
    glyph: "f(x)",
  },
  {
    id: "integral",
    label: "∫ — التكامل والتراكم",
    branch: "التكامل والتطبيقات",
    formula: "∫ₐᵇ f(x) dx = F(b) - F(a)",
    desc: "المساحات تحت المنحنيات وحجوم الأجسام الدورانية",
    imageSrc: "/images/symbols/integral.png",
    glyph: "∫",
  },
  {
    id: "x2",
    label: "x² — القوى والمعادلات",
    branch: "الجبر الخطي والتربيعي",
    formula: "(a + b)² = a² + 2ab + b²",
    desc: "المعادلات التربيعية والمحددات والمصفوفات",
    imageSrc: "/images/symbols/x2.png",
    glyph: "x²",
  },
  {
    id: "delta",
    label: "Δ — المميز والهندسة",
    branch: "الهندسة الفراغية والجبر",
    formula: "Δ = b² - 4ac",
    desc: "نوع جذري المعادلة والمجسمات الفراغية ثلاثية الأبعاد",
    imageSrc: "/images/symbols/delta.png",
    glyph: "Δ",
  },
];
