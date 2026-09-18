import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "× | ساحة النيون",
  description: "تحدَّ صديقك في ساحة النيون. لعبة × للاعبين على جهاز واحد، بأجواء كونية وتجربة عربية كاملة.",
  applicationName: "×",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#070812" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
