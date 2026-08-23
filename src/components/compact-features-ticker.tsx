"use client";

import React, { useState } from "react";
import { Award, CirclePlay as PlayCircle, Layers, Wallet, CheckCircle2, Zap } from "lucide-react";

const FEATURES = [
  {
    id: "f1",
    tag: "01 // STRUCTURE",
    icon: Layers,
    title: "منهج منظّم كالبرهان",
    text: "تسلسل منطقي صارم: مفهوم ← مثال محلول ← تدريب مكثف ← اختبار قياسي.",
    accent: "#B8FF00",
  },
  {
    id: "f2",
    tag: "02 // FOCUS",
    icon: PlayCircle,
    title: "فيديوهات نقية بلا تشتيت",
    text: "استضافة احترافية، جودة FHD، استئناف المشاهدة تلقائياً من حيث توقفت.",
    accent: "#38BDF8",
  },
  {
    id: "f3",
    tag: "03 // MASTERY",
    icon: Award,
    title: "اختبارات بتصحيح فوري",
    text: "بنك أسئلة معياري مطابق لمواصفات الوزارة مع إيضاح خطوات الحل كاملة.",
    accent: "#A78BFA",
  },
  {
    id: "f4",
    tag: "04 // FINANCE",
    icon: Wallet,
    title: "محفظة رقمية وفواتير",
    text: "شحن فوري، أكواد خصم، وفواتير إلكترونية شفافة لكل معاملة.",
    accent: "#FBBF24",
  },
];

export function CompactFeaturesSection() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <section className="relative border-t border-[#22262E] bg-[#080A0C] py-8 sm:py-10 overflow-hidden">
      {/* Background Subtle Cyber Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,rgba(184,255,0,0.06),transparent_60%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 space-y-5">
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A1E24] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#B8FF00]/10 border border-[#B8FF00]/30 text-[#B8FF00]">
              <Zap size={14} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-tag text-[#B8FF00] uppercase">
                  WHY DROS MATH
                </span>
                <span className="inline-block size-1 rounded-full bg-[#B8FF00]" />
                <span className="text-[11px] font-ui text-[#6E7681]">المزايا المحورية</span>
              </div>
              <h2 className="type-h3 text-white leading-snug">
                لماذا تختار منصة دروس ماث مع مستر محمد سعيد؟
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111418] border border-[#22262E] px-3 py-1 text-[11px] font-mono text-[#8E98A5]">
              <span className="size-1.5 rounded-full bg-[#B8FF00] animate-ping" />
              عرض تفاعلي متحرك
            </span>
          </div>
        </div>

        {/* Compact Moving Staggered Banner / Broken Animation Strip */}
        <div className="relative overflow-hidden pt-1" dir="ltr">
          {/* Edge Blur / Mask */}
          <div className="pointer-events-none absolute inset-y-0 start-0 w-12 sm:w-20 bg-gradient-to-r from-[#080A0C] to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 end-0 w-12 sm:w-20 bg-gradient-to-l from-[#080A0C] to-transparent z-20" />

          {/* Infinite Staggered Marquee Track */}
          <div 
            className="flex w-max items-stretch gap-3.5 hover:[animation-play-state:paused]"
            style={{
              animation: "marquee 22s linear infinite"
            }}
          >
            {[...FEATURES, ...FEATURES, ...FEATURES].map((item, idx) => {
              const Icon = item.icon;
              const isSelected = activeFeature === `${item.id}-${idx}`;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onMouseEnter={() => setActiveFeature(`${item.id}-${idx}`)}
                  onMouseLeave={() => setActiveFeature(null)}
                  className={`group relative w-[270px] sm:w-[300px] shrink-0 rounded-xl border p-3.5 sm:p-4 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? "border-[#B8FF00] bg-[#14181E] shadow-[0_0_20px_rgba(184,255,0,0.15)] -translate-y-1"
                      : "border-[#1F242C] bg-[#0E1115] hover:border-[#B8FF00]/60 hover:bg-[#12161B]"
                  }`}
                  dir="rtl"
                >
                  {/* Top Tag & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="grid size-8 place-items-center rounded-lg border transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: "#050505",
                          borderColor: isSelected ? item.accent : "#262C36",
                          color: item.accent,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-[#8E98A5] tracking-tag">
                        {item.tag}
                      </span>
                    </div>

                    <span className="size-1.5 rounded-full bg-[#B8FF00]/40 group-hover:bg-[#B8FF00] transition-colors" />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1">
                    <h3 className="type-h3 text-sm text-white group-hover:text-[#B8FF00] transition-colors flex items-center gap-1.5">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-ui leading-relaxed text-[#8E98A5] line-clamp-2 font-normal">
                      {item.text}
                    </p>
                  </div>

                  {/* Micro Footer Accent */}
                  <div className="mt-3 pt-2 border-t border-[#1C2128] flex items-center justify-between text-[10px] font-mono text-[#6E7681]">
                    <span className="flex items-center gap-1 group-hover:text-[#D0D5DD] transition-colors font-ui">
                      <CheckCircle2 size={11} className="text-[#B8FF00]" />
                      ميزة نشطة
                    </span>
                    <span className="text-[#4E5664] tracking-tag">SYSTEM VERIFIED</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
