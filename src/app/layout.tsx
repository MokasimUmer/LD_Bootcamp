import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Africa Free Routing (AFR) - Lightning Developer Bootcamp",
  description:
    "Full-Stack Bitcoin Lightning Network Developer Bootcamp Platform across Africa. Dynamic QR Attendance, LLM Quizzes, Live Arcade Leaderboards, and Automated LNURL-pay Sat Payouts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0E14] text-slate-100 min-h-screen flex flex-col font-sans selection:bg-afr-amber selection:text-slate-950">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 font-mono">
          <p>
            ⚡ Africa Free Routing (AFR) Lightning Network Developer Bootcamp Platform &copy; 2026
          </p>
        </footer>
      </body>
    </html>
  );
}
