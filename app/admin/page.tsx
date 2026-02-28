"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Home,
  LayoutGrid,
  LogOut,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AcademicYearPicker } from "@/components/ui/academic-year-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Course } from "@/lib/courses";
import { extractCalendarId } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

type FilterType = "all" | "pending" | "approved" | "rejected";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; payload: Record<string, unknown> }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1">
          {label}
        </p>
        <p className="text-sm font-bold text-zinc-900 dark:text-white">
          {payload[0].value}{" "}
          <span className="text-[10px] font-normal opacity-50 uppercase tracking-tighter">
            richieste
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"courses" | "stats">("courses");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "delete" | "verify" | null;
    course: Course | null;
  }>({
    open: false,
    action: null,
    course: null,
  });
  const [addCourseDialog, setAddCourseDialog] = useState(false);
  const [newCourse, setNewCourse] = useState<{
    name: string;
    calendarUrl: string;
    year: number | "";
    academicYear: string;
  }>({
    name: "",
    calendarUrl: "",
    year: "",
    academicYear: "",
  });
  const router = useRouter();
  const utils = api.useUtils();

  const loginMutation = api.admin.login.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
        setIsAuthenticated(true);
        setPassword("");
        setError("");
      }
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("adminToken");
    if (token) setIsAuthenticated(true);
  }, []);

  const {
    data: courses,
    isLoading: isLoadingCourses,
    error: coursesError,
  } = api.courses.getAllForAdmin.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "courses",
    retry: 1,
  });

  const { data: stats } = api.analytics.getStats.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "stats",
  });

  const { data: dailyRequests } = api.analytics.getDailyRequests.useQuery(
    undefined,
    {
      enabled: isAuthenticated && activeTab === "stats",
    },
  );

  const { data: hourlyRequests } =
    api.analytics.getHourlyRequestsToday.useQuery(undefined, {
      enabled: isAuthenticated && activeTab === "stats",
    });

  const { data: topEndpoints } = api.analytics.getTopEndpoints.useQuery(
    undefined,
    {
      enabled: isAuthenticated && activeTab === "stats",
    },
  );

  const processedDailyData = useMemo(() => {
    if (!dailyRequests) return [];
    return dailyRequests.map((d) => ({
      date: new Date(d.date).toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
      }),
      richieste: d.count,
    }));
  }, [dailyRequests]);

  const processedHourlyData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      richieste: hourlyRequests?.find((h) => h.hour === i)?.count || 0,
    }));
  }, [hourlyRequests]);

  useEffect(() => {
    if (coursesError && isAuthenticated) {
      const msg = coursesError.message.toLowerCase();
      if (msg.includes("unauthorized") || msg.includes("non autorizzato")) {
        localStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        setError("Sessione scaduta.");
      }
    }
  }, [coursesError, isAuthenticated]);

  const approveMutation = api.courses.approve.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setConfirmDialog({ open: false, action: null, course: null });
    },
  });
  const rejectMutation = api.courses.reject.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setConfirmDialog({ open: false, action: null, course: null });
    },
  });
  const deleteMutation = api.courses.delete.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setConfirmDialog({ open: false, action: null, course: null });
    },
  });
  const verifyMutation = api.courses.verify.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setConfirmDialog({ open: false, action: null, course: null });
    },
  });

  const addCourseMutation = api.courses.add.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setAddCourseDialog(false);
      setNewCourse({ name: "", calendarUrl: "", year: "", academicYear: "" });
    },
    onError: (e) => alert(e.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ password });
  };
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    router.push("/");
  };

  const handleCopyCourseLink = async (linkId: string, courseId: string) => {
    try {
      await navigator.clipboard.writeText(linkId);
      setCopiedCourseId(courseId);
      setTimeout(() => setCopiedCourseId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = (
    action: "approve" | "reject" | "delete" | "verify",
    course: Course,
  ) => setConfirmDialog({ open: true, action, course });

  const executeAction = () => {
    if (!confirmDialog.course) return;
    const cid = confirmDialog.course.id;
    if (confirmDialog.action === "approve")
      approveMutation.mutate({ courseId: cid });
    if (confirmDialog.action === "reject")
      rejectMutation.mutate({ courseId: cid });
    if (confirmDialog.action === "delete")
      deleteMutation.mutate({ courseId: cid });
    if (confirmDialog.action === "verify")
      verifyMutation.mutate({ courseId: cid });
  };

  const handleAddCourse = () => {
    if (
      !newCourse.name.trim() ||
      !newCourse.calendarUrl.trim() ||
      newCourse.year === ""
    )
      return alert("Campi obbligatori mancanti");
    const linkId = extractCalendarId(newCourse.calendarUrl);
    if (!linkId) return alert("Link non valido");
    addCourseMutation.mutate({
      name: newCourse.name,
      linkId,
      year: newCourse.year as number,
      academicYear: newCourse.academicYear || undefined,
      addedBy: "admin",
    });
  };

  if (!isClient) return null;

  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] bg-white dark:bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm relative z-10"
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all mb-8 group font-mono text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Torna alla Home
          </button>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center mb-8 mx-auto shadow-lg">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-white font-serif">
              Pannello Admin
            </h1>
            <p className="text-xs text-center text-zinc-400 mb-8 font-mono uppercase tracking-widest">
              Accesso Riservato
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative group">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm font-mono"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center"
                >
                  {error}
                </motion.p>
              )}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg hover:shadow-zinc-900/20 dark:hover:shadow-white/10 disabled:opacity-50"
              >
                {loginMutation.isPending ? "Accesso..." : "Entra"}
              </button>
            </form>
          </div>
        </motion.div>
        <div className="mt-8 flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  const pendingCourses = courses?.filter((c) => c.status === "pending") || [];
  const approvedCourses = courses?.filter((c) => c.status === "approved") || [];
  const rejectedCourses = courses?.filter((c) => c.status === "rejected") || [];

  return (
    <div className="h-[100dvh] bg-white dark:bg-black text-zinc-900 dark:text-white flex flex-col overflow-hidden fixed inset-0">
      <main className="w-full px-4 py-3 portrait:py-4 lg:px-8 lg:py-6 flex-1 max-w-screen-2xl mx-auto flex flex-col overflow-hidden">
        <header className="flex items-center justify-between mb-4 lg:mb-8 flex-shrink-0 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl shadow-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-bold font-serif tracking-tight truncate leading-none">
                  Admin Panel
                </h1>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1 truncate">
                  Gestione Sistema
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("courses")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === "courses"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Corsi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === "stats"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => router.push("/")}
              className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-blue-500 transition-all active:scale-90 flex-shrink-0"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setAddCourseDialog(true)}
              className="p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl transition-all active:scale-90 shadow-md flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all active:scale-90 flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === "courses" ? (
              <motion.div
                key="courses"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 overflow-x-auto pb-2 px-1 no-scrollbar text-nowrap">
                  {(
                    [
                      {
                        id: "all",
                        label: "Tutti",
                        count: courses?.length || 0,
                        color: "zinc",
                      },
                      {
                        id: "pending",
                        label: "Attesa",
                        count: pendingCourses.length,
                        color: "amber",
                      },
                      {
                        id: "approved",
                        label: "Approvati",
                        count: approvedCourses.length,
                        color: "emerald",
                      },
                      {
                        id: "rejected",
                        label: "Rifiutati",
                        count: rejectedCourses.length,
                        color: "red",
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-[10px] font-bold uppercase tracking-widest font-mono",
                        filter === f.id
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-md scale-105"
                          : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300",
                      )}
                    >
                      {f.label}
                      <span className="opacity-50">{f.count}</span>
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10">
                  {isLoadingCourses ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-30">
                      <div className="w-8 h-8 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {courses
                        ?.filter((c) => filter === "all" || c.status === filter)
                        .map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            onApprove={() => handleAction("approve", course)}
                            onReject={() => handleAction("reject", course)}
                            onDelete={() => handleAction("delete", course)}
                            onVerify={() => handleAction("verify", course)}
                            copiedCourseId={copiedCourseId}
                            onCopyLink={handleCopyCourseLink}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-8 pb-10"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Utenti"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="h-4 w-4" />}
                    color="blue"
                    subtitle="Totali registrati"
                  />
                  <StatCard
                    title="Oggi"
                    value={stats?.activeToday || 0}
                    icon={<Activity className="h-4 w-4" />}
                    color="green"
                    subtitle="Utenti attivi"
                  />
                  <StatCard
                    title="Richieste"
                    value={stats?.totalRequests || 0}
                    icon={<Globe className="h-4 w-4" />}
                    color="purple"
                    subtitle="Traffico API"
                  />
                  <StatCard
                    title="Carico"
                    value={stats?.requestsToday || 0}
                    icon={<BarChart3 className="h-4 w-4" />}
                    color="orange"
                    subtitle="Nelle ultime 24h"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartSection
                    title="Richieste (30gg)"
                    icon={<Calendar className="h-4 w-4 text-blue-500" />}
                  >
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedDailyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#88888820"
                          />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#888888" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#888888" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="richieste"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              fill: "#3b82f6",
                              strokeWidth: 2,
                              stroke: "#fff",
                            }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartSection>

                  <ChartSection
                    title="Orario di Picco"
                    icon={<Clock className="h-4 w-4 text-orange-500" />}
                  >
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedHourlyData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#88888820"
                          />
                          <XAxis
                            dataKey="hour"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#888888" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: "#888888" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="richieste" radius={[4, 4, 0, 0]}>
                            {processedHourlyData.map((_entry, index) => (
                              <Cell
                                key={`cell-${_entry.hour}`}
                                fill={index % 2 === 0 ? "#f97316" : "#f9731680"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartSection>
                </div>

                <ChartSection
                  title="Endpoint Popolari"
                  icon={<LayoutGrid className="h-4 w-4 text-purple-500" />}
                >
                  <div className="space-y-4">
                    {topEndpoints?.map((endpoint) => (
                      <div key={endpoint.endpoint} className="group">
                        <div className="flex justify-between items-center mb-1.5 px-1">
                          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-tight">
                            {endpoint.endpoint}
                          </span>
                          <span className="text-[10px] font-mono font-bold">
                            {endpoint.count}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 h-2 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(endpoint.count / (topEndpoints[0]?.count || 1)) * 100}%`,
                            }}
                            className="bg-purple-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ChartSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Dialog open={addCourseDialog} onOpenChange={setAddCourseDialog}>
        <DialogContent className="max-w-lg rounded-[2.5rem] p-0 border-none bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 lg:p-10 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="font-serif text-2xl">
              Aggiungi Corso
            </DialogTitle>
            <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 mt-2">
              Nuova configurazione sistema
              <span className="sr-only">Aggiungi nuovo corso</span>
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 lg:p-10 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="admin-course-name"
                className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 ml-1"
              >
                Nome Corso
              </label>
              <input
                id="admin-course-name"
                type="text"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, name: e.target.value })
                }
                placeholder="Es: Informatica - Vare"
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="admin-course-url"
                className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 ml-1"
              >
                Cineca URL
              </label>
              <input
                id="admin-course-url"
                type="text"
                value={newCourse.calendarUrl}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, calendarUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-5 py-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="admin-course-year"
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 ml-1"
                >
                  Anno
                </label>
                <Select
                  value={newCourse.year === "" ? "" : String(newCourse.year)}
                  onValueChange={(v) =>
                    setNewCourse({ ...newCourse, year: Number(v) })
                  }
                >
                  <SelectTrigger
                    id="admin-course-year"
                    className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800"
                  >
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <SelectItem
                        key={y}
                        value={String(y)}
                        className="rounded-xl"
                      >
                        {y}° Anno
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="admin-academic-year"
                  className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 ml-1"
                >
                  Accademico
                </label>
                <AcademicYearPicker
                  id="admin-academic-year"
                  value={newCourse.academicYear}
                  onChange={(v) =>
                    setNewCourse({ ...newCourse, academicYear: v })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 gap-3">
            <button
              type="button"
              onClick={() => setAddCourseDialog(false)}
              className="px-6 py-3 font-bold text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleAddCourse}
              disabled={addCourseMutation.isPending}
              className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-zinc-900/20 dark:shadow-none"
            >
              Salva
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(o) =>
          !o && setConfirmDialog({ open: false, action: null, course: null })
        }
      >
        <DialogContent className="rounded-[2.5rem] bg-white dark:bg-zinc-900 border-none shadow-2xl">
          <DialogHeader className="p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              {confirmDialog.action === "delete" ? (
                <Trash2 className="text-red-500" />
              ) : (
                <ShieldCheck className="text-blue-500" />
              )}
            </div>
            <DialogTitle className="font-serif text-xl">
              Conferma Operazione
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-zinc-500 font-medium leading-relaxed">
              Stai per{" "}
              {confirmDialog.action === "approve"
                ? "approvare"
                : confirmDialog.action === "reject"
                  ? "rifiutare"
                  : confirmDialog.action === "delete"
                    ? "eliminare"
                    : "verificare"}{" "}
              il corso{" "}
              <span className="text-zinc-900 dark:text-white font-bold">
                {confirmDialog.course?.name}
              </span>
              . Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="p-6 gap-2">
            <button
              type="button"
              onClick={() =>
                setConfirmDialog({ open: false, action: null, course: null })
              }
              className="flex-1 py-3 font-bold text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={executeAction}
              className={cn(
                "flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg",
                confirmDialog.action === "delete"
                  ? "bg-red-500 shadow-red-500/20"
                  : "bg-zinc-900 dark:bg-white dark:text-black shadow-zinc-900/20",
              )}
            >
              Conferma
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  subtitle: string;
}) {
  const cMap: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20",
    green:
      "from-green-500/10 to-green-500/5 text-green-600 dark:text-green-400 border-green-500/20",
    purple:
      "from-purple-500/10 to-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20",
    orange:
      "from-orange-500/10 to-orange-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20",
  };
  return (
    <div
      className={cn(
        "relative p-6 rounded-[2rem] border bg-gradient-to-br transition-all hover:scale-[1.02] overflow-hidden group shadow-sm",
        cMap[color],
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl shadow-sm">
            {icon}
          </div>
          <span className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-60">
            {title}
          </span>
        </div>
        <p className="text-3xl font-bold font-mono tracking-tighter mb-1">
          {value.toLocaleString()}
        </p>
        <p className="text-[9px] font-mono font-bold uppercase tracking-tighter opacity-40">
          {subtitle}
        </p>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
  );
}

function ChartSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2.5rem] p-6 lg:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
          {icon}
        </div>
        <h2 className="text-sm font-bold font-serif uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

interface CourseCardProps {
  course: Course;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete: () => void;
  onVerify?: () => void;
  copiedCourseId: string | null;
  onCopyLink: (linkId: string, courseId: string) => void;
}

function CourseCard({
  course,
  onApprove,
  onReject,
  onDelete,
  onVerify,
  copiedCourseId,
  onCopyLink,
}: CourseCardProps) {
  const statusConfig = {
    pending: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      label: "Attesa",
      icon: "⏳",
    },
    approved: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
      label: "Attivo",
      icon: "✓",
    },
    rejected: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
      label: "Rifiutato",
      icon: "✕",
    },
  }[course.status as "pending" | "approved" | "rejected"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none transition-all"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="text-base font-bold font-serif text-zinc-900 dark:text-white mb-2 leading-tight truncate">
            {course.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold font-mono uppercase border",
                statusConfig.bg,
                statusConfig.border,
                statusConfig.text,
              )}
            >
              {statusConfig.label}
            </span>
            {course.verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 text-[9px] font-bold font-mono uppercase">
                <ShieldCheck className="h-3 w-3" /> Verificato
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-500 text-[9px] font-bold font-mono uppercase">
              {course.year}° Anno
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onCopyLink(course.linkId, course.id)}
            className={cn(
              "p-2.5 rounded-xl transition-all shadow-sm active:scale-90 border",
              copiedCourseId === course.id
                ? "bg-emerald-500 text-white border-transparent"
                : "bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-100 dark:border-zinc-700",
            )}
          >
            {copiedCourseId === course.id ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <code className="text-[10px] font-mono text-zinc-400 block truncate">
            {course.linkId}
          </code>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-tighter">
            <span>By {course.addedBy}</span>
            <div className="w-1 h-1 rounded-full bg-zinc-300" />
            <span>{new Date(course.createdAt).toLocaleDateString("it")}</span>
          </div>
          <div className="flex items-center gap-1">
            {onApprove && course.status !== "approved" && (
              <ActionButton
                onClick={onApprove}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                color="emerald"
              />
            )}
            {onVerify && !course.verified && (
              <ActionButton
                onClick={onVerify}
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                color="blue"
              />
            )}
            {onReject && course.status === "pending" && (
              <ActionButton
                onClick={onReject}
                icon={<XCircle className="w-3.5 h-3.5" />}
                color="amber"
              />
            )}
            <ActionButton
              onClick={onDelete}
              icon={<Trash2 className="w-3.5 h-3.5" />}
              color="red"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  onClick,
  icon,
  color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
}) {
  const cMap: Record<string, string> = {
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-500 hover:text-white border-emerald-100 dark:border-emerald-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-500 hover:text-white border-blue-100 dark:border-blue-800",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-500 hover:text-white border-amber-100 dark:border-amber-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-500 hover:text-white border-red-100 dark:border-red-800",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl border transition-all active:scale-90 shadow-sm",
        cMap[color],
      )}
    >
      {icon}
    </button>
  );
}
