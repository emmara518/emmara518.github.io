import sharp from "sharp";
import path from "node:path";

// Branded stage-art placeholders (owner's real artwork replaces these later —
// designated asset slots per docs/02 §design system).
const targets = [
  { file: "public/images/stages/prep.jpg", hue: "#0f4c48", accent: "#ffd400" },
  { file: "public/images/stages/sec1_2.jpg", hue: "#0b3d5c", accent: "#7ee8c9" },
];

for (const t of targets) {
  const svg = `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${t.hue}"/>
        <stop offset="100%" stop-color="#081514"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="900" fill="url(#g)"/>
    <g fill="none" stroke="${t.accent}" stroke-opacity="0.35" stroke-width="3">
      <path d="M0,700 Q300,540 600,700 T1200,700"/>
      <path d="M0,780 Q300,640 600,780 T1200,780"/>
      <circle cx="950" cy="220" r="120"/>
      <path d="M120,150 l0,160 m-80,-80 l160,0"/>
    </g>
    <text x="600" y="460" font-family="Georgia, serif" font-size="120" fill="${t.accent}" fill-opacity="0.85" text-anchor="middle">∫ Σ π</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(t.file);
  console.log("created", t.file);
}
