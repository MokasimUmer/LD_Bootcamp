"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LogOut, Shield, MapPin, Award } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("afr_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); }
      catch (e) { setUser(null); }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("afr_token");
    localStorage.removeItem("afr_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-yellow-400/[0.08] backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-glow-gold group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white group-hover:text-yellow-300 transition-colors">
                AFR
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 font-bold">
                LIGHTNING
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase leading-none">
              Developer Bootcamp
            </p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-yellow-500/70" />
            <span>Bootcamps</span>
          </Link>
          {user && (
            user.role === "ORGANIZER" || user.role === "ADMIN" ? (
              <Link href="/organizer" className="text-sm font-medium text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-yellow-500/70" />
                <span>Organizer Portal</span>
              </Link>
            ) : (
              <Link href="/developer" className="text-sm font-medium text-slate-400 hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                <Award className="w-4 h-4 text-yellow-500/70" />
                <span>Developer Portal</span>
              </Link>
            )
          )}
        </nav>

        {/* Auth area */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{user.name}</span>
                <Badge variant={user.role === "ORGANIZER" || user.role === "ADMIN" ? "terracotta" : "amber"}>
                  {user.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:border-red-500/40">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm" className="shadow-glow-gold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
