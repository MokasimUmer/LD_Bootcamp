"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, User, Shield, Code, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"DEVELOPER" | "ORGANIZER">("DEVELOPER");
  const [lightningAddress, setLightningAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", {
        name,
        email,
        password,
        role,
        lightningAddress: lightningAddress ? lightningAddress : undefined,
      });

      const { accessToken, user } = res.data;
      localStorage.setItem("afr_token", accessToken);
      localStorage.setItem("afr_user", JSON.stringify(user));

      if (user.role === "ORGANIZER") {
        router.push("/organizer");
      } else {
        router.push("/developer");
      }
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
          <h2 className="text-3xl font-extrabold font-display text-white">Join AFR Bootcamp</h2>
          <p className="text-sm text-slate-400">
            Create your account as a Developer or Bootcamp Organizer
          </p>
        </div>

        <Card className="afr-glass border-slate-800 shadow-glow-amber/10">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection Segmented Control */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRole("DEVELOPER")}
                    className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      role === "DEVELOPER"
                        ? "bg-afr-amber text-slate-950 shadow-glow-amber"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    <span>DEVELOPER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("ORGANIZER")}
                    className={`flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      role === "ORGANIZER"
                        ? "bg-afr-terracotta text-white shadow-glow-terracotta"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>ORGANIZER</span>
                  </button>
                </div>
              </div>

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
                variant={role === "DEVELOPER" ? "amber" : "terracotta"}
                size="lg"
                disabled={loading}
                className="w-full mt-2"
              >
                {loading ? "Creating Account..." : `Register as ${role}`}
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
