"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Zap, CheckCircle2, Trophy, Send, AlertCircle, Lock, CheckSquare, Square } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import axios from "axios";

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

  const fetchRegistrations = async (token: string) => {
    try {
      const res = await axios.get("http://localhost:4000/api/registrations/my-registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistrations(res.data);
      if (res.data.length > 0) {
        setActiveReg(res.data[0]);
        fetchQuiz(res.data[0].bootcampId, 1, token);
      }
    } catch (e) {}
  };

  const fetchMyPayouts = async (token: string) => {
    try {
      const res = await axios.get("http://localhost:4000/api/payouts/my-payouts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayouts(res.data);
    } catch (e) {}
  };

  const fetchQuiz = async (bootcampId: string, dayNum: number, token?: string) => {
    setQuizResult(null);
    setSelectedAnswers({});
    const authToken = token || localStorage.getItem("afr_token");
    try {
      const res = await axios.get(`http://localhost:4000/api/quiz/bootcamp/${bootcampId}/day/${dayNum}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setQuizData(res.data);
    } catch (e) {
      setQuizData(null);
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
        "http://localhost:4000/api/quiz/submit",
        {
          bootcampId: activeReg.bootcampId,
          dayNumber: activeDay,
          answers: answersArray,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuizResult(res.data);
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
        "http://localhost:4000/api/submissions",
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
        "http://localhost:4000/api/auth/lightning-address",
        { lightningAddress: lnAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("afr_user", JSON.stringify({ ...user, lightningAddress: lnAddress }));
      setLnMsg("Lightning Address saved successfully!");
    } catch (e) {
      setLnMsg("Failed to update Lightning Address.");
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
                          className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold ${
                            log
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
                  className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                    activeDay === dayNum
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
                              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-xs transition-all border text-left ${
                                isDone
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
                      {quizData?.quizUnlocked && (
                        <Badge variant="emerald">UNLOCKED BY ORGANIZER</Badge>
                      )}
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
                    ) : quizResult ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-afr-amber/40 space-y-3 text-center">
                        <Badge variant="emerald" className="mx-auto">
                          QUIZ COMPLETED
                        </Badge>
                        <h3 className="text-3xl font-black font-display text-afr-amber-light">
                          {quizResult.score} / {quizResult.maxScore} POINTS
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Score updated in Redis Sorted Set & broadcast to live leaderboard!
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
                                className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                                  selectedAnswers[q.id] === optIdx
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

                    {quizData?.quizUnlocked && allTasksDone && !quizResult && (
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
