"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const { accessToken, user } = res.data;
      localStorage.setItem("afr_token", accessToken);
      localStorage.setItem("afr_user", JSON.stringify(user));

      const targetPath = user.role === "ORGANIZER" || user.role === "ADMIN" ? "/organizer" : "/developer";
      window.location.href = targetPath;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to authenticate. Please check credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-afr-amber to-afr-terracotta p-0.5 shadow-glow-amber mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-afr-amber fill-afr-amber" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400">
            Sign in to access your Africa Free Routing Lightning Bootcamp dashboard
          </p>
        </div>

        <Card className="afr-glass border-slate-800 shadow-glow-amber/10">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg afr-glass-terracotta flex items-center space-x-2 text-afr-terracotta-warm text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    required
                    placeholder="developer@afr.lightning"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="amber"
                size="lg"
                disabled={loading}
                className="w-full shadow-glow-amber mt-2"
              >
                {loading ? "Authenticating..." : "Sign In to Portal"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-afr-amber hover:underline font-semibold">
                Register as Developer
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
