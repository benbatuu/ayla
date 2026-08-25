import type { Metadata } from "next";
import PageViewTracker from "../components/PageViewTracker";
import "../globals.css";

export const metadata: Metadata = {
  title: "Ay'la Food & More | Menü",
  description: "Ay'la Food & More | Bazı Şeyler Asla Değişmez",
};

export default function MenuRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#171613]">
      <PageViewTracker isMenu />
      {children}
    </div>
  );
}
