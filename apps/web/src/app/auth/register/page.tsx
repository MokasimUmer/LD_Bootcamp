"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, User, Shield, Code, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lightningAddress, setLightningAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
        role: "DEVELOPER",
        lightningAddress: lightningAddress ? lightningAddress : undefined,
      });

      const { accessToken, user } = res.data;
      localStorage.setItem("afr_token", accessToken);
      localStorage.setItem("afr_user", JSON.stringify(user));

      router.push("/developer");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-afr-amber to-afr-terracotta p-0.5 shadow-glow-amber mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-afr-amber fill-afr-amber" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold font-display text-white">Developer Registration</h2>
          <p className="text-sm text-slate-400">
            Create your Developer account for Africa Free Routing Bootcamps
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
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="text"
                    required
                    placeholder="Satoshi Nakamoto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    required
                    placeholder="satoshi@afr.lightning"
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
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Lightning Address (LUD-16 for Sat Payouts)
                </label>
                <div className="relative">
                  <Zap className="w-4 h-4 absolute left-3 top-3 text-afr-amber" />
                  <Input
                    type="text"
                    placeholder="e.g. user@getalby.com (optional)"
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    className="pl-9 font-mono text-xs text-afr-amber-light"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Winners receive satoshi payouts directly to this Lightning Address.
                </p>
              </div>

              <Button
                type="submit"
                variant="amber"
                size="lg"
                disabled={loading}
                className="w-full mt-2 shadow-glow-amber"
              >
                {loading ? "Creating Account..." : "Create Developer Account"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              Already registered?{" "}
              <Link href="/auth/login" className="text-afr-amber hover:underline font-semibold">
                Sign in to your portal
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
