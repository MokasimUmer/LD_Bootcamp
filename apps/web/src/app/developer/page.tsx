"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Zap, Award, QrCode, BookOpen, CheckCircle2, Trophy, Send, Edit3, AlertCircle, ArrowRight, Shield, Lock, CheckSquare, Square, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

export default function DeveloperPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeReg, setActiveReg] = useState<any>(null);

  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedTasks, setCompletedTasks] = useState<{ [day: number]: { [taskIdx: number]: boolean } }>({});

  const [quizData, setQuizData] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeftSeconds]);

  // Day 5 Submission Form
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subStatus, setSubStatus] = useState<string>("");

  // Lightning Address edit
  const [lnAddress, setLnAddress] = useState("");
  const [lnMsg, setLnMsg] = useState("");

  const [payouts, setPayouts] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("afr_token");
    const storedUser = localStorage.getItem("afr_user");
    if (!token || !storedUser) {
      router.push("/auth/login");
      return;
    }
    const parsed = JSON.parse(storedUser);

    // Strict Role Guard
    if (parsed.role === "ORGANIZER" || parsed.role === "ADMIN") {
      router.push("/organizer");
      return;
    }

    setUser(parsed);
    setLnAddress(parsed.lightningAddress || "");

    fetchRegistrations(token);
    fetchMyPayouts(token);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("afr_token");
    if (!token) return;
    const interval = setInterval(() => {
      fetchMyPayouts(token);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrations = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/registrations/my-registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data);
      if (res.data.length > 0) {
        setActiveReg(res.data[0]);
        fetchQuiz(res.data[0].bootcampId, 1, token);
      }
    } catch (e) { }
  };

  const fetchMyPayouts = async (token: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payouts/my-payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayouts(res.data);
    } catch (e) { }
  };

  const fetchLeaderboard = async (bootcampId: string, dayNum: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/quiz/leaderboard/${bootcampId}/day/${dayNum}`);
      setLeaderboard(res.data || []);
    } catch (e) { }
  };

  const fetchQuiz = async (bootcampId: string, dayNum: number, token?: string) => {
    setQuizResult(null);
    setSelectedAnswers({});
    const authToken = token || localStorage.getItem("afr_token");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/quiz/bootcamp/${bootcampId}/day/${dayNum}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setQuizData(res.data);
      if (res.data?.timeRemainingSeconds !== undefined) {
        setTimeLeftSeconds(res.data.timeRemainingSeconds);
      } else {
        setTimeLeftSeconds(null);
      }
      fetchLeaderboard(bootcampId, dayNum);
    } catch (e) {
      setQuizData(null);
      setTimeLeftSeconds(null);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    setActiveDay(dayNum);
    if (activeReg && dayNum <= 4) {
      fetchQuiz(activeReg.bootcampId, dayNum);
    }
  };

  const toggleTaskCompleted = (dayNum: number, taskIdx: number) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [dayNum]: {
        ...prev[dayNum],
        [taskIdx]: !prev[dayNum]?.[taskIdx],
      },
    }));
  };

  const handleAnswerSelect = (qId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeReg || !quizData) return;
    const token = localStorage.getItem("afr_token");

    const answersArray = Object.entries(selectedAnswers).map(([qId, idx]) => ({
      questionId: Number(qId),
      selectedIndex: idx,
    }));

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/quiz/submit`,
        {
          bootcampId: activeReg.bootcampId,
          dayNumber: activeDay,
          answers: answersArray,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuizResult(res.data);
      if (activeReg) {
        fetchLeaderboard(activeReg.bootcampId, activeDay);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Quiz submission failed.");
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReg) return;
    const token = localStorage.getItem("afr_token");
    setSubStatus("");

    try {
      await axios.post(
        `${API_BASE_URL}/api/submissions`,
        {
          bootcampId: activeReg.bootcampId,
          githubUrl,
          demoUrl: demoUrl ? demoUrl : undefined,
          description: subDescription,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubStatus("Day 5 Project submitted successfully! Organizers will review and grade your entry.");
    } catch (err: any) {
      setSubStatus(err.response?.data?.message || "Submission failed.");
    }
  };

  const handleUpdateLnAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("afr_token");
    try {
      await axios.put(
        `${API_BASE_URL}/api/auth/lightning-address`,
        { lightningAddress: lnAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("afr_user", JSON.stringify({ ...user, lightningAddress: lnAddress }));
      setLnMsg("Lightning Address saved successfully!");
    } catch (e) {
      setLnMsg("Failed to update Lightning Address.");
    }
  };

  // Lightning Winner Claim State
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);
  const [customBolt11, setCustomBolt11] = useState("");

  const handleClaimWinnerPrize = async () => {
    if (!activeReg) return;
    const token = localStorage.getItem("afr_token");
    setClaimLoading(true);
    setClaimResult(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/payouts/claim-winner`,
        {
          bootcampId: activeReg.bootcampId,
          dayNumber: activeDay,
          lightningAddress: lnAddress,
          bolt11Invoice: customBolt11,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaimResult(res.data);
      fetchMyPayouts(token);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to claim prize payout.");
    } finally {
      setClaimLoading(false);
    }
  };

  if (!user || user.role !== "DEVELOPER") return null;

  const currentCurriculum = (activeReg?.bootcamp?.curriculum as any[]) || [];
  const currentDayModule = currentCurriculum.find((c) => c.day === activeDay) || {
    title: `Day ${activeDay} Curriculum`,
    contentMarkdown: `Welcome to Day ${activeDay} of the bootcamp!`,
    tasks: ["Complete daily reading", "Execute practical exercises"],
    quizUnlocked: false,
  };

  const dayTasks = currentDayModule.tasks || [
    "Complete daily technical reading",
    "Execute Lightning integration exercises",
  ];
  const allTasksDone = dayTasks.every((_: any, idx: number) => completedTasks[activeDay]?.[idx]);

  return (
    <div className="space-y-6">
      {/* Developer Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#120A00] via-[#1C1200] to-[#120A00] border border-yellow-500/25 p-6 shadow-glow-gold">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">Developer Portal</h1>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold">DEVELOPER</span>
              </div>
              <p className="text-sm text-white/80 mt-0.5">
                Welcome back, <span className="font-semibold text-white">{user.name}</span> — QR badge, tasks, quizzes & payouts
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <form onSubmit={handleUpdateLnAddress} className="flex items-center space-x-2 bg-white/15 backdrop-blur-md border border-white/20 p-2 rounded-xl">
              <Zap className="w-4 h-4 text-white ml-2" />
              <Input
                type="text"
                placeholder="user@getalby.com"
                value={lnAddress}
                onChange={(e) => setLnAddress(e.target.value)}
                className="h-8 text-xs font-mono text-white w-48 bg-black/20 border-white/20 placeholder:text-white/50"
              />
              <Button type="submit" variant="ghost" size="sm" className="bg-white text-afr-amber hover:bg-slate-100">
                Save
              </Button>
            </form>
            {lnMsg && (
              <p className={`text-xs font-mono ${lnMsg.includes("success") ? "text-white" : "text-white/70"}`}>
                {lnMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl afr-glass border border-slate-800 p-12 text-center">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-afr-amber/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-afr-amber to-afr-terracotta flex items-center justify-center mx-auto shadow-glow-amber">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
            <p className="text-slate-400">You are not currently enrolled in any bootcamps.</p>
            <Button variant="amber" className="shadow-glow-amber" onClick={() => router.push("/")}>
              Explore Open Bootcamps
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: QR Badge — distinct deep-bronze card */}
          <div className="space-y-6">
            <div className="card-qr p-5 flex flex-col items-center space-y-4">
              <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-200 text-[10px] font-bold border border-yellow-500/30">OFFICIAL DEVELOPER BADGE</span>
              <h3 className="text-lg font-bold text-white text-center">{activeReg?.bootcamp?.title}</h3>
              <p className="text-xs text-white/80 font-bold">
                📍 {activeReg?.bootcamp?.city?.country?.name} &bull; {activeReg?.bootcamp?.city?.name}
              </p>

              <div className="relative p-4 rounded-2xl bg-white shadow-lg">
                <QRCodeSVG
                  value={activeReg?.qrToken || "AFR-DEV"}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-afr-amber flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-afr-amber fill-afr-amber" />
                  </div>
                </div>
              </div>

              <div className="text-center space-y-1 w-full">
                <p className="text-xs font-mono text-white/70">CRYPTOGRAPHIC QR TOKEN</p>
                <p className="text-[11px] font-mono text-white bg-black/30 px-2 py-1 rounded border border-white/20 break-all">
                  {activeReg?.qrToken}
                </p>
              </div>

              <div className="w-full bg-black/30 p-3 rounded-xl border border-yellow-500/20 space-y-2">
                <span className="text-xs font-mono text-yellow-200/60 block">5-DAY ATTENDANCE SCAN LOGS</span>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const log = activeReg?.attendanceLogs?.find((l: any) => l.dayNumber === day);
                    return (
                      <div
                        key={day}
                        className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold ${log
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-yellow-500/5 border-yellow-500/15 text-yellow-200/30"
                          }`}
                      >
                        D{day}
                        {log && <CheckCircle2 className="w-3 h-3 mx-auto mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl afr-glass border border-slate-800 p-5 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-afr-amber" />
                <span>Satoshi Payout History</span>
              </h3>
              {payouts.length === 0 ? (
                <p className="text-xs text-slate-500">No payouts recorded yet.</p>
              ) : (
                payouts.map((p) => (
                  <div key={p.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-afr-amber-light">{p.amountSats} SATS</span>
                      <Badge variant={p.status === "PAID" ? "emerald" : "terracotta"}>{p.status}</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 truncate">Preimage: {p.preimage || "N/A"}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: 5-Day Curriculum, Tasks Checklist & Quiz Interface */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2 p-1.5 rounded-2xl afr-glass border border-slate-800 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((dayNum) => (
                <button
                  key={dayNum}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all ${activeDay === dayNum
                      ? dayNum === 5
                        ? "bg-afr-terracotta text-white shadow-glow-terracotta"
                        : "bg-afr-amber text-slate-950 shadow-glow-amber"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                >
                  DAY {dayNum} {dayNum === 5 ? "(HACKATHON)" : ""}
                </button>
              ))}
            </div>

            {/* Days 1 to 4: Curriculum, Checklist Tasks & Organizer-Unlocked Quiz */}
            {activeDay <= 4 ? (
              <div className="space-y-6">
                <Card className="afr-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="amber">DAY {activeDay} CURRICULUM</Badge>
                      <Badge variant={currentDayModule.quizUnlocked ? "emerald" : "terracotta"}>
                        {currentDayModule.quizUnlocked ? "QUIZ UNLOCKED" : "QUIZ LOCKED BY ORGANIZER"}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mt-2">{currentDayModule.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Markdown Curriculum Content */}
                    <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-sans">
                      {currentDayModule.contentMarkdown}
                    </div>

                    {/* Media Attachments & Learning Resources Gallery */}
                    {currentDayModule.resources && currentDayModule.resources.length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs font-mono text-afr-amber uppercase flex items-center space-x-1.5">
                            <ExternalLink className="w-4 h-4 text-afr-amber" />
                            <span>Day {activeDay} Learning Resources & Media ({currentDayModule.resources.length})</span>
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">Curated by Organizers</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentDayModule.resources.map((res: any, idx: number) => {
                            if (res.type === "IMAGE") {
                              return (
                                <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white truncate">{res.title}</span>
                                    <Badge variant="amber" className="text-[9px]">PHOTO</Badge>
                                  </div>
                                  <div className="overflow-hidden rounded-md border border-slate-800 bg-slate-950 max-h-48 flex items-center justify-center">
                                    <img src={res.url} alt={res.title} className="w-full object-cover max-h-48" />
                                  </div>
                                  {res.description && <p className="text-[11px] text-slate-400">{res.description}</p>}
                                </div>
                              );
                            }

                            if (res.type === "VIDEO") {
                              const isYoutube = res.url.includes("youtube.com") || res.url.includes("youtu.be");
                              let embedUrl = res.url;
                              if (isYoutube) {
                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                const match = res.url.match(regExp);
                                if (match && match[2].length === 11) {
                                  embedUrl = `https://www.youtube.com/embed/${match[2]}`;
                                }
                              }

                              return (
                                <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900 space-y-2 md:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white truncate">{res.title}</span>
                                    <Badge variant="terracotta" className="text-[9px]">VIDEO TUTORIAL</Badge>
                                  </div>
                                  {isYoutube ? (
                                    <div className="aspect-video w-full rounded-md overflow-hidden border border-slate-800">
                                      <iframe
                                        src={embedUrl}
                                        title={res.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-between p-3 rounded-md bg-slate-950 border border-slate-800 text-xs text-afr-amber hover:underline"
                                    >
                                      <span>Watch Video: {res.title}</span>
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                  {res.description && <p className="text-[11px] text-slate-400">{res.description}</p>}
                                </div>
                              );
                            }

                            return (
                              <a
                                key={idx}
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-all block space-y-1 group"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white group-hover:text-afr-amber truncate">{res.title}</span>
                                  <Badge variant="emerald" className="text-[9px]">{res.type}</Badge>
                                </div>
                                <p className="text-[10px] font-mono text-afr-amber underline truncate">{res.url}</p>
                                {res.description && <p className="text-[11px] text-slate-400">{res.description}</p>}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Interactive Daily Task Checklist */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs font-mono text-afr-amber uppercase">
                          Day {activeDay} Mandatory Task Checklist
                        </h4>
                        <span className="text-xs text-slate-400 font-mono">
                          {Object.values(completedTasks[activeDay] || {}).filter(Boolean).length} / {dayTasks.length} Done
                        </span>
                      </div>

                      <div className="space-y-2">
                        {dayTasks.map((t: string, tIdx: number) => {
                          const isDone = Boolean(completedTasks[activeDay]?.[tIdx]);
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => toggleTaskCompleted(activeDay, tIdx)}
                              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-xs transition-all border text-left ${isDone
                                  ? "bg-afr-emerald/10 border-afr-emerald/30 text-afr-emerald font-semibold"
                                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                                }`}
                            >
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-afr-emerald flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              )}
                              <span className={isDone ? "line-through opacity-80" : ""}>{t}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Milestone Quiz Display (Only displayed if Organizer unlocked AND Day tasks complete) */}
                <Card className="afr-card border-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="w-5 h-5 text-afr-amber" />
                        <span>Day {activeDay} Milestone Quiz</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {quizData?.quizUnlocked && !quizData?.hasCompleted && !quizResult && timeLeftSeconds !== null && (
                          <Badge variant={timeLeftSeconds > 60 ? "amber" : "terracotta"} className="font-mono">
                            ⏱ {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                        {quizData?.quizUnlocked && (
                          <Badge variant="emerald">UNLOCKED BY ORGANIZER</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {!quizData?.quizUnlocked ? (
                      <div className="p-6 rounded-xl afr-glass-terracotta text-center space-y-3">
                        <Lock className="w-8 h-8 text-afr-terracotta mx-auto" />
                        <h4 className="text-base font-bold text-slate-200">Quiz Currently Locked</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          {quizData?.message || `The Day ${activeDay} quiz is locked by your bootcamp organizer. Finish your daily tasks and wait for your organizer to publish the quiz.`}
                        </p>
                      </div>
                    ) : !allTasksDone ? (
                      <div className="p-6 rounded-xl afr-glass-amber text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-afr-amber mx-auto" />
                        <h4 className="text-base font-bold text-afr-amber-light">Complete Daily Tasks First</h4>
                        <p className="text-xs text-slate-300 max-w-md mx-auto">
                          Check off all mandatory tasks in the checklist above before attempting the Day {activeDay} Milestone Quiz.
                        </p>
                      </div>
                    ) : quizData?.hasCompleted ? (
                      <div className="p-6 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3 text-center">
                        <Badge variant="emerald" className="mx-auto">
                          QUIZ COMPLETED
                        </Badge>
                        <h3 className="text-3xl font-black font-display text-emerald-400">
                          {quizData.completedScore} / {quizData.maxScore} POINTS ({quizData.percentage}%)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Completed on {new Date(quizData.completedAt).toLocaleDateString()}
                        </p>
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                          Your score is recorded in Redis Sorted Sets and published to the live arcade leaderboard!
                        </div>
                      </div>
                    ) : quizResult ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-afr-amber/40 space-y-3 text-center">
                        <Badge variant="emerald" className="mx-auto">
                          QUIZ COMPLETED
                        </Badge>
                        <h3 className="text-3xl font-black font-display text-afr-amber-light">
                          {quizResult.score} / {quizResult.maxScore} POINTS ({quizResult.percentage}%)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Score updated in Redis Sorted Set & broadcast to live leaderboard!
                        </p>
                      </div>
                    ) : timeLeftSeconds === 0 ? (
                      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
                        <h4 className="text-base font-bold text-red-300">Quiz Timed Window Expired</h4>
                        <p className="text-xs text-slate-300 max-w-md mx-auto">
                          The timed quiz window for Day {activeDay} has expired. Please contact your bootcamp organizer if you need extra time.
                        </p>
                      </div>
                    ) : (
                      quizData?.questions?.map((q: any) => (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                          <h4 className="font-semibold text-sm text-slate-200">
                            {q.id}. {q.question}
                          </h4>
                          <div className="space-y-2">
                            {q.options.map((opt: string, optIdx: number) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={() => handleAnswerSelect(q.id, optIdx)}
                                className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${selectedAnswers[q.id] === optIdx
                                    ? "bg-afr-amber/20 border-afr-amber text-afr-amber-light font-bold"
                                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                  }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    {quizData?.quizUnlocked && allTasksDone && !quizData?.hasCompleted && !quizResult && timeLeftSeconds !== 0 && (
                      <Button
                        variant="amber"
                        size="lg"
                        onClick={handleSubmitQuiz}
                        className="w-full shadow-glow-amber"
                      >
                        Submit Day {activeDay} Quiz Answers
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Top 3 Quiz Winner Lightning Invoice & Payout Claim Widget */}
                {(() => {
                  const myRankIndex = leaderboard.findIndex(
                    (item: any) => item.developerId === user?.id || item.developer?.id === user?.id
                  );
                  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
                  if (myRank === null || myRank > 3) return null;

                  const prizeSats = myRank === 1 ? 10000 : myRank === 2 ? 5000 : 2500;
                  const isQuizStillActive = quizData ? Boolean(quizData.quizUnlocked) : Boolean(currentDayModule.quizUnlocked);

                  return (
                    <Card className="afr-glass border-emerald-500/50 shadow-glow-emerald">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-afr-amber" />
                            <CardTitle className="text-base text-emerald-300">
                              🏆 CONGRATULATIONS! YOU PLACED #{myRank} IN DAY {activeDay} QUIZ!
                            </CardTitle>
                          </div>
                          <Badge variant="emerald" className="font-mono w-fit">
                            {myRank === 1 ? "🥇 1ST PLACE - 10,000 SATS" : myRank === 2 ? "🥈 2ND PLACE - 5,000 SATS" : "🥉 3RD PLACE - 2,500 SATS"}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-slate-300">
                          You qualify for a Top 3 Lightning Network prize! Once the quiz timer ends and final standings are locked by the organizer, generate your invoice below.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-2">
                        {isQuizStillActive ? (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                            <Badge variant="amber" className="mx-auto">QUIZ STILL LIVE</Badge>
                            <p className="text-xs text-amber-200 font-medium">
                              ⏳ The Day {activeDay} quiz is currently live for other participants!
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Invoice generation opens as soon as the organizer stops the quiz to lock final leaderboard ranks.
                            </p>
                          </div>
                        ) : claimResult ? (
                          <div className="p-4 rounded-xl space-y-4 bg-amber-950/30 border border-amber-500/40">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm flex items-center space-x-1.5 text-amber-300">
                                <Zap className="w-4 h-4 text-afr-amber fill-afr-amber" />
                                <span>
                                  {claimResult.alreadyClaimed
                                    ? "Prize Previously Settled"
                                    : "⚡ Winner Invoice Generated & Sent to Organizer!"}
                                </span>
                              </span>
                              <Badge variant={claimResult.alreadyClaimed ? "emerald" : "amber"}>
                                {claimResult.alreadyClaimed ? "PAID ⚡" : "PENDING ORGANIZER PAYMENT ⚡"}
                              </Badge>
                            </div>

                            <p className="text-xs font-mono text-slate-300">
                              Amount: <strong className="text-afr-amber">{claimResult.amountSats || prizeSats} SATS</strong> | Rank: <strong>#{claimResult.rank}</strong> | Destination: <span className="underline">{claimResult.lightningAddress}</span>
                            </p>

                            {/* Render Generated Invoice QR & BOLT11 for Developer */}
                            {claimResult.bolt11 && (
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center bg-slate-950/90 p-4 rounded-xl border border-slate-800">
                                <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-md">
                                  <QRCodeSVG
                                    value={claimResult.bolt11}
                                    size={110}
                                    level="M"
                                    includeMargin={true}
                                  />
                                  <span className="text-[9px] font-mono font-bold text-slate-900 mt-1 uppercase text-center">
                                    {claimResult.amountSats} Sats Invoice
                                  </span>
                                </div>

                                <div className="sm:col-span-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold text-afr-amber uppercase">Generated BOLT11 Invoice:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(claimResult.bolt11);
                                        alert("⚡ BOLT11 invoice copied!");
                                      }}
                                      className="text-[10px] font-mono text-slate-300 hover:text-white underline"
                                    >
                                      📋 Copy BOLT11
                                    </button>
                                  </div>
                                  <div className="max-h-20 overflow-y-auto bg-slate-900 p-2 rounded border border-slate-800">
                                    <p className="text-[10px] font-mono text-amber-200/90 break-all select-all">
                                      {claimResult.bolt11}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <p className="text-[11px] text-slate-400 font-mono">
                              {claimResult.message}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Your Lightning Wallet / Address (LNURL)
                                </label>
                                <Input
                                  type="text"
                                  placeholder="developer@getalby.com"
                                  value={lnAddress}
                                  onChange={(e) => setLnAddress(e.target.value)}
                                  className="h-9 text-xs font-mono text-afr-amber-light"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                                  Custom BOLT11 Invoice (Optional)
                                </label>
                                <Input
                                  type="text"
                                  placeholder="lnbc100u1p..."
                                  value={customBolt11}
                                  onChange={(e) => setCustomBolt11(e.target.value)}
                                  className="h-9 text-xs font-mono"
                                />
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="amber"
                              disabled={claimLoading}
                              onClick={handleClaimWinnerPrize}
                              className="w-full text-xs font-mono font-bold h-10 shadow-glow-amber"
                            >
                              <Zap className="w-4 h-4 mr-1.5 fill-slate-950" />
                              {claimLoading
                                ? "Submitting Invoice to Organizer Portal..."
                                : `⚡ Generate & Submit ${prizeSats.toLocaleString()} Sats Invoice to Organizer`}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Day Live Leaderboard Table */}
                <Card className="afr-card border-slate-800">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-afr-amber" />
                        <span>Day {activeDay} Live Arcade Leaderboard</span>
                      </CardTitle>
                      <Badge variant="live">LIVE REDIS RANKINGS</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No scores recorded for Day {activeDay} yet. Be the first to submit!</p>
                    ) : (
                      <div className="divide-y divide-slate-800/60">
                        {leaderboard.map((entry: any) => (
                          <div key={entry.developerId} className="py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-3">
                              <span className={`font-mono font-bold w-6 h-6 rounded flex items-center justify-center text-[11px] ${entry.rank === 1 ? "bg-amber-500 text-slate-950" : entry.rank === 2 ? "bg-slate-300 text-slate-950" : entry.rank === 3 ? "bg-amber-700 text-white" : "bg-slate-900 text-slate-400"
                                }`}>
                                #{entry.rank}
                              </span>
                              <div>
                                <p className="font-semibold text-slate-200">{entry.name}</p>
                                {entry.lightningAddress && (
                                  <p className="text-[10px] font-mono text-afr-amber-light">{entry.lightningAddress}</p>
                                )}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-afr-amber">{entry.score} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Day 5: Hackathon Project Submission */
              <Card className="afr-card border-afr-terracotta/40 shadow-glow-terracotta/10">
                <CardHeader>
                  <Badge variant="terracotta" className="w-fit">
                    DAY 5 HACKATHON
                  </Badge>
                  <CardTitle className="text-2xl">Submit Your Lightning App</CardTitle>
                  <CardDescription>
                    Provide your GitHub repository link and live demo URL to compete for satoshi prize payouts.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {subStatus && (
                    <div className="mb-4 p-3 rounded-lg afr-glass-emerald text-afr-emerald text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{subStatus}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitProject} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                        GitHub Repository URL *
                      </label>
                      <Input
                        type="url"
                        required
                        placeholder="https://github.com/username/lightning-app"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                        Live Demo / WebLN App URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://my-lightning-app.vercel.app"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                        Project Description & Architecture *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Describe your Lightning project, LNURL/LUD-16 features, and tech stack..."
                        value={subDescription}
                        onChange={(e) => setSubDescription(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-afr-terracotta"
                      />
                    </div>

                    <Button type="submit" variant="terracotta" size="lg" className="w-full shadow-glow-terracotta">
                      <Send className="w-4 h-4 mr-2" />
                      <span>Submit Day 5 Hackathon Entry</span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
