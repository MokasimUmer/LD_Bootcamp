"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, LogOut, Shield, MapPin, Award } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("afr_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("afr_token");
    localStorage.removeItem("afr_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full afr-glass border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-afr-amber to-afr-terracotta p-0.5 shadow-glow-amber group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-afr-amber fill-afr-amber" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-lg tracking-tight text-white group-hover:text-afr-amber-light transition-colors">
                AFR
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-afr-amber font-mono font-bold">
                LIGHTNING
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Free Routing Developer Bootcamp
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-300 hover:text-afr-amber transition-colors flex items-center space-x-1.5"
          >
            <MapPin className="w-4 h-4 text-afr-terracotta-warm" />
            <span>Bootcamps</span>
          </Link>

          {/* Strict Role Separation in Navigation */}
          {user && (
            <>
              {user.role === "ORGANIZER" || user.role === "ADMIN" ? (
                <Link
                  href="/organizer"
                  className="text-sm font-medium text-slate-300 hover:text-afr-amber transition-colors flex items-center space-x-1.5"
                >
                  <Shield className="w-4 h-4 text-afr-amber" />
                  <span>Organizer Portal</span>
                </Link>
              ) : (
                <Link
                  href="/developer"
                  className="text-sm font-medium text-slate-300 hover:text-afr-amber transition-colors flex items-center space-x-1.5"
                >
                  <Award className="w-4 h-4 text-afr-emerald" />
                  <span>Developer Portal</span>
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-100">{user.name}</span>
                <Badge variant={user.role === "ORGANIZER" ? "terracotta" : "amber"}>
                  {user.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:border-red-500/40"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="amber" size="sm" className="shadow-glow-amber">
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
