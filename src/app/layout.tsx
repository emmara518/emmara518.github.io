import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Cairo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CosmicFluidBackground } from "@/components/cosmic-fluid-background";

const graphikArabic = localFont({
  src: [
    {
      path: "../../public/fonts/graphik-arabic-regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/graphik-arabic-medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/graphik-arabic-semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/graphik-arabic-semibold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-graphik-arabic",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "دروس ماث | منصة أ/ محمد سعيد للرياضيات",
    template: "%s | دروس ماث",
  },
  description:
    "منصة دروس ماث للرياضيات — كورسات منظمة بالفيديو عبر YouTube، اختبارات بتصحيح فوري، محفظة وكوبونات، ومتابعة دقيقة للتقدم. للمرحلتين الإعدادية والثانوية.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06080f" },
    { media: "(prefers-color-scheme: light)", color: "#f6f5f0" },
  ],
};

/** Runs before paint: prevents theme flash. Default = blackboard dark. */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('dros-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch(e) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getSessionUser();
  const headerUser = sessionUser ? { name: sessionUser.name, role: sessionUser.role } : null;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${graphikArabic.variable} ${cairo.variable} ${plexMono.variable} min-h-screen font-sans antialiased bg-bg text-ink`}>
        <CosmicFluidBackground />
        <SiteHeader user={headerUser} />
        <div className="relative z-10 min-h-screen">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
