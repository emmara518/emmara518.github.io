import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getSessionUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CosmicFluidBackground } from "@/components/cosmic-fluid-background";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
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
(function(){try{
var t=localStorage.getItem('dros-theme');
if(t!=='light'){document.documentElement.classList.add('dark')}
}catch(e){document.documentElement.classList.add('dark')}})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const sessionUser = await getSessionUser();
  const headerUser = sessionUser ? { name: sessionUser.name, role: sessionUser.role } : null;

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${plexArabic.variable} ${plexMono.variable} min-h-screen font-sans antialiased bg-[#04060b]`}>
        <CosmicFluidBackground />
        <SiteHeader user={headerUser} />
        <div className="relative z-10 min-h-screen">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
