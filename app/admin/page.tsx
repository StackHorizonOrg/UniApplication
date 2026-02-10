"use client";

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  LogOut,
  Plus,
  Shield,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AcademicYearPicker } from "@/components/ui/academic-year-picker";
import { Button } from "@/components/ui/button";
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
import { ThemeToggle } from "../components/ThemeToggle";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
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
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const {
    data: courses,
    isLoading,
    error: coursesError,
  } = api.courses.getAllForAdmin.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
  });

  useEffect(() => {
    if (coursesError && isAuthenticated) {
      const errorMessage = coursesError.message.toLowerCase();
      if (
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("non autorizzato")
      ) {
        localStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        setError("Sessione scaduta. Effettua nuovamente il login.");
      }
    }
  }, [coursesError, isAuthenticated]);

  const approveMutation = api.courses.approve.useMutation({
    onSuccess: () => {
      utils.courses.getAllForAdmin.invalidate();
      setConfirmDialog({ open: false, action: null, course: null });
    },
    onError: (error) => {
      alert(error.message);
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
    onError: (error) => {
      alert(error.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate({ password });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setError("");
    router.push("/");
  };

  const handleCopyCourseLink = async (linkId: string, courseId: string) => {
    try {
      await navigator.clipboard.writeText(linkId);
      setCopiedCourseId(courseId);
      setTimeout(() => setCopiedCourseId(null), 2000);
    } catch (err) {
      console.error("Errore durante la copia:", err);
    }
  };

  const handleAction = (
    action: "approve" | "reject" | "delete" | "verify",
    course: Course,
  ) => {
    setConfirmDialog({ open: true, action, course });
  };

  const executeAction = () => {
    if (!confirmDialog.course) return;

    switch (confirmDialog.action) {
      case "approve":
        approveMutation.mutate({ courseId: confirmDialog.course.id });
        break;
      case "reject":
        rejectMutation.mutate({ courseId: confirmDialog.course.id });
        break;
      case "delete":
        deleteMutation.mutate({ courseId: confirmDialog.course.id });
        break;
      case "verify":
        verifyMutation.mutate({ courseId: confirmDialog.course.id });
        break;
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.name.trim() || !newCourse.calendarUrl.trim()) {
      alert("Nome e Link Calendario sono obbligatori");
      return;
    }

    if (newCourse.year === "") {
      alert("Seleziona l'anno del corso");
      return;
    }

    const linkId = extractCalendarId(newCourse.calendarUrl);
    if (!linkId) {
      alert(
        "Link calendario non valido. Assicurati di incollare l'URL completo.",
      );
      return;
    }

    addCourseMutation.mutate({
      name: newCourse.name,
      linkId: linkId,
      year: newCourse.year as number,
      academicYear: newCourse.academicYear || undefined,
      addedBy: "admin",
    });
  };

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Torna alla Home</span>
          </button>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8 shadow-sm">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-gray-900 dark:text-white" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
              Admin Login
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              Inserisci la password per accedere al pannello amministrativo
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </div>
        </div>
        <ThemeToggle />
      </div>
    );
  }

  const pendingCourses = courses?.filter((c) => c.status === "pending") || [];
  const approvedCourses = courses?.filter((c) => c.status === "approved") || [];
  const rejectedCourses = courses?.filter((c) => c.status === "rejected") || [];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white font-serif flex items-center gap-3">
              <Shield className="h-9 w-9" />
              Admin Panel
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Gestisci corsi e approvazioni
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddCourseDialog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
            >
              <Plus className="h-4 w-4" />
              Aggiungi Corso
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border rounded-xl p-5 text-left transition-all ${
              filter === "pending"
                ? "border-yellow-400 dark:border-yellow-600 ring-2 ring-yellow-400 dark:ring-yellow-600 ring-opacity-50"
                : "border-yellow-200 dark:border-yellow-900 hover:border-yellow-300 dark:hover:border-yellow-800"
            }`}
          >
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-1">
              In Attesa
            </p>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
              {pendingCourses.length}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
              {pendingCourses.length === 1
                ? "corso da approvare"
                : "corsi da approvare"}
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFilter("approved")}
            className={`bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border rounded-xl p-5 text-left transition-all ${
              filter === "approved"
                ? "border-green-400 dark:border-green-600 ring-2 ring-green-400 dark:ring-green-600 ring-opacity-50"
                : "border-green-200 dark:border-green-900 hover:border-green-300 dark:hover:border-green-800"
            }`}
          >
            <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">
              Approvati
            </p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {approvedCourses.length}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {approvedCourses.filter((c) => c.verified).length} verificati
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFilter("rejected")}
            className={`bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border rounded-xl p-5 text-left transition-all ${
              filter === "rejected"
                ? "border-red-400 dark:border-red-600 ring-2 ring-red-400 dark:ring-red-600 ring-opacity-50"
                : "border-red-200 dark:border-red-900 hover:border-red-300 dark:hover:border-red-800"
            }`}
          >
            <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">
              Rifiutati
            </p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100">
              {rejectedCourses.length}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              {rejectedCourses.length === 1
                ? "corso rifiutato"
                : "corsi rifiutati"}
            </p>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Filtra:
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "all"
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
              }`}
            >
              Tutti ({courses?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "pending"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                  : "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900"
              }`}
            >
              In Attesa ({pendingCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "approved"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                  : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/30 border border-green-200 dark:border-green-900"
              }`}
            >
              Approvati ({approvedCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === "rejected"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                  : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 border border-red-200 dark:border-red-900"
              }`}
            >
              Rifiutati ({rejectedCourses.length})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
              Caricamento corsi...
            </p>
          </div>
        ) : coursesError ? (
          <div className="text-center py-16">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-900 dark:text-red-100 font-medium mb-2">
                Errore nel caricamento
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {coursesError.message}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {filter === "all" && (
              <>
                {pendingCourses.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                      In Attesa di Approvazione
                    </h2>
                    <div className="space-y-3">
                      {pendingCourses.map((course) => (
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
                  </section>
                )}

                {approvedCourses.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                      Corsi Approvati
                    </h2>
                    <div className="space-y-3">
                      {approvedCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onReject={() => handleAction("reject", course)}
                          onDelete={() => handleAction("delete", course)}
                          onVerify={() => handleAction("verify", course)}
                          copiedCourseId={copiedCourseId}
                          onCopyLink={handleCopyCourseLink}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {rejectedCourses.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                      Corsi Rifiutati
                    </h2>
                    <div className="space-y-3">
                      {rejectedCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onApprove={() => handleAction("approve", course)}
                          onDelete={() => handleAction("delete", course)}
                          onVerify={() => handleAction("verify", course)}
                          copiedCourseId={copiedCourseId}
                          onCopyLink={handleCopyCourseLink}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {filter === "pending" && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                  In Attesa di Approvazione
                </h2>
                {pendingCourses.length > 0 ? (
                  <div className="space-y-3">
                    {pendingCourses.map((course) => (
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
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-yellow-200 dark:border-yellow-900 rounded-xl bg-yellow-50/30 dark:bg-yellow-950/10">
                    <p className="text-yellow-600 dark:text-yellow-400">
                      Nessun corso in attesa
                    </p>
                  </div>
                )}
              </section>
            )}

            {filter === "approved" && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                  Corsi Approvati
                </h2>
                {approvedCourses.length > 0 ? (
                  <div className="space-y-3">
                    {approvedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onReject={() => handleAction("reject", course)}
                        onDelete={() => handleAction("delete", course)}
                        onVerify={() => handleAction("verify", course)}
                        copiedCourseId={copiedCourseId}
                        onCopyLink={handleCopyCourseLink}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-green-200 dark:border-green-900 rounded-xl bg-green-50/30 dark:bg-green-950/10">
                    <p className="text-green-600 dark:text-green-400">
                      Nessun corso approvato
                    </p>
                  </div>
                )}
              </section>
            )}

            {filter === "rejected" && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-serif">
                  Corsi Rifiutati
                </h2>
                {rejectedCourses.length > 0 ? (
                  <div className="space-y-3">
                    {rejectedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onApprove={() => handleAction("approve", course)}
                        onDelete={() => handleAction("delete", course)}
                        onVerify={() => handleAction("verify", course)}
                        copiedCourseId={copiedCourseId}
                        onCopyLink={handleCopyCourseLink}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-red-200 dark:border-red-900 rounded-xl bg-red-50/30 dark:bg-red-950/10">
                    <p className="text-red-600 dark:text-red-400">
                      Nessun corso rifiutato
                    </p>
                  </div>
                )}
              </section>
            )}

            {courses?.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  Nessun corso presente
                </p>
                <button
                  type="button"
                  onClick={() => setAddCourseDialog(true)}
                  className="text-sm text-gray-900 dark:text-white underline hover:no-underline"
                >
                  Aggiungi il primo corso
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={addCourseDialog} onOpenChange={setAddCourseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Corso</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del corso da aggiungere. Il corso sarà
              automaticamente approvato e verificato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="course-name-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nome del Corso *
              </label>
              <input
                id="course-name-input"
                type="text"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, name: e.target.value })
                }
                placeholder="Es: Informatica - Varese"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="calendar-url-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Link Pubblico Calendario (Cineca) *
              </label>
              <input
                id="calendar-url-input"
                type="text"
                value={newCourse.calendarUrl}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, calendarUrl: e.target.value })
                }
                placeholder="https://.../getImpegniCalendarioPubblico?linkCalendarioId=..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all font-mono text-xs"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Incolla l'URL completo del calendario pubblico fornito
                dall'università
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="course-year-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Anno del Corso *
                </label>
                <Select
                  value={newCourse.year === "" ? "" : String(newCourse.year)}
                  onValueChange={(value) =>
                    setNewCourse({
                      ...newCourse,
                      year: value === "" ? "" : Number(value),
                    })
                  }
                >
                  <SelectTrigger
                    id="course-year-input"
                    className="bg-gray-50 dark:bg-gray-900 h-11"
                  >
                    <SelectValue placeholder="Seleziona anno..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1° Anno</SelectItem>
                    <SelectItem value="2">2° Anno</SelectItem>
                    <SelectItem value="3">3° Anno</SelectItem>
                    <SelectItem value="4">4° Anno</SelectItem>
                    <SelectItem value="5">5° Anno</SelectItem>
                    <SelectItem value="6">6° Anno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="academic-year-input"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Anno Accademico
                </label>
                <AcademicYearPicker
                  value={newCourse.academicYear}
                  onChange={(value) =>
                    setNewCourse({ ...newCourse, academicYear: value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddCourseDialog(false);
                setNewCourse({
                  name: "",
                  calendarUrl: "",
                  year: "",
                  academicYear: "",
                });
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={handleAddCourse}
              disabled={addCourseMutation.isPending}
            >
              {addCourseMutation.isPending ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ open: false, action: null, course: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Azione</DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "approve" &&
                `Sei sicuro di voler approvare il corso "${confirmDialog.course?.name}"?`}
              {confirmDialog.action === "reject" &&
                `Sei sicuro di voler rifiutare il corso "${confirmDialog.course?.name}"?`}
              {confirmDialog.action === "delete" &&
                `Sei sicuro di voler eliminare il corso "${confirmDialog.course?.name}"? Questa azione è irreversibile.`}
              {confirmDialog.action === "verify" &&
                `Sei sicuro di voler verificare il corso "${confirmDialog.course?.name}"? Questo aggiungerà un badge "Verificato" al corso.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, action: null, course: null })
              }
            >
              Annulla
            </Button>
            <Button
              onClick={executeAction}
              variant={
                confirmDialog.action === "delete" ? "destructive" : "default"
              }
              disabled={
                approveMutation.isPending ||
                rejectMutation.isPending ||
                deleteMutation.isPending ||
                verifyMutation.isPending
              }
            >
              {confirmDialog.action === "approve" && "Approva"}
              {confirmDialog.action === "reject" && "Rifiuta"}
              {confirmDialog.action === "delete" && "Elimina"}
              {confirmDialog.action === "verify" && "Verifica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ThemeToggle />
    </div>
  );
}

function CourseCard({
  course,
  onApprove,
  onReject,
  onDelete,
  onVerify,
  copiedCourseId,
  onCopyLink,
}: {
  course: Course;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onVerify?: () => void;
  copiedCourseId: string | null;
  onCopyLink: (linkId: string, courseId: string) => void;
}) {
  const getStatusConfig = (status: Course["status"]) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950/30",
          border: "border-yellow-200 dark:border-yellow-900",
          text: "text-yellow-700 dark:text-yellow-300",
          label: "In Attesa",
          icon: "⏳",
        };
      case "approved":
        return {
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-200 dark:border-green-900",
          text: "text-green-700 dark:text-green-300",
          label: "Approvato",
          icon: "✓",
        };
      case "rejected":
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-900",
          text: "text-red-700 dark:text-red-300",
          label: "Rifiutato",
          icon: "✕",
        };
    }
  };

  const statusConfig = getStatusConfig(course.status);

  return (
    <div className="group bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
              {course.name}
            </h3>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
              >
                <span>{statusConfig.icon}</span>
                {statusConfig.label}
              </span>

              {course.verified && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300">
                  <ShieldCheck className="h-3 w-3" />
                  Verificato
                </span>
              )}

              {course.year && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300">
                  <GraduationCap className="w-3 h-3" />
                  {course.year}° Anno
                </span>
              )}

              {course.academicYear && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300">
                  <Calendar className="w-3 h-3" />
                  {course.academicYear}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Aggiunto da{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {course.addedBy}
              </span>
            </span>
            <span>•</span>
            <span>
              {new Date(course.createdAt).toLocaleDateString("it-IT")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate block">
                {course.linkId}
              </code>
            </div>
            <button
              type="button"
              onClick={() => onCopyLink(course.linkId, course.id)}
              className={`p-2 rounded-lg transition-all ${
                copiedCourseId === course.id
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent"
              }`}
              title={
                copiedCourseId === course.id ? "Link Copiato!" : "Copia Link ID"
              }
            >
              {copiedCourseId === course.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Azioni:
          </span>
          <div className="flex items-center gap-2">
            {onApprove && (
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
                title="Approva corso"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approva
              </button>
            )}

            {onVerify && !course.verified && (
              <button
                type="button"
                onClick={onVerify}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
                title="Verifica corso"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Verifica
              </button>
            )}

            {onReject && (
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
                title="Rifiuta corso"
              >
                <XCircle className="h-3.5 w-3.5" />
                Rifiuta
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm"
                title="Elimina corso"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Elimina
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
