import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/common/Header";
import { Sidebar } from "@/components/common/Sidebar";

export const metadata: Metadata = {
  title: "TERRAGUARD AI — AI-Based Landslide Risk Monitoring System (NER)",
  description: "Disaster management and early warning command center for North Eastern Region (SIH26001). Tagline: Predict Risk. Warn Early. Protect Communities.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="bg-[#070b14] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-red-900/60 selection:text-white">
        <Header />
        <div className="flex flex-1 min-h-[calc(100vh-53px)]">
          <Sidebar />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto min-w-0 bg-[#070b14]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
