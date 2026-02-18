import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  Info,
  Link2,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AcademicYearPicker } from "@/components/ui/academic-year-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Course } from "@/lib/courses";
import { useLocalStorage, useUserId } from "@/lib/hooks";
import { extractCalendarId } from "@/lib/orario-utils";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean;
  onShowWelcome?: () => void;
}

const INITIAL_HIDDEN_SUBJECTS: string[] = [];

export function SettingsDialog({
  isOpen,
  onClose,
  forceOpen = false,
  onShowWelcome,
}: SettingsDialogProps) {
  const router = useRouter();
  const [calendarId, setCalendarId] = useLocalStorage<string>("calendarId", "");
  const [_courseName, setCourseName] = useLocalStorage<string>(
    "courseName",
    "",
  );
  const [storedCourseId, setStoredCourseId] = useLocalStorage<string>(
    "courseId",
    "",
  );
  const [calendarUrlStore, setCalendarUrlStore] = useLocalStorage<string>(
    "calendarUrl",
    "",
  );
  const [calendarUrl, setCalendarUrl] = useState("");
  const [hiddenSubjects, setHiddenSubjects] = useLocalStorage<string[]>(
    "hiddenSubjects",
    INITIAL_HIDDEN_SUBJECTS,
  );
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<"select" | "add">("select");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseYear, setNewCourseYear] = useState<number | "">("");
  const [newAcademicYear, setNewAcademicYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [viewMode, setViewMode] = useState<"split" | "tabs">("split");
  const [settingsTab, setSettingsTab] = useState<"course" | "subjects">(
    "course",
  );

  const userId = useUserId();

  useEffect(() => {
    const checkSize = () => {
      if (window.innerHeight < 700) {
        setViewMode("tabs");
      } else {
        setViewMode("split");
      }
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const { data: courses = [], refetch: refetchCourses } =
    api.courses.getAll.useQuery({ userId });
  const addCourseMutation = api.courses.add.useMutation({
    onSuccess: () => {
      refetchCourses();
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Errore durante l'aggiunta del corso");
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      setPreviewId(null);
      setSelectedCourse(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (calendarUrlStore) {
        setCalendarUrl(calendarUrlStore);
        const extracted = extractCalendarId(calendarUrlStore);
        if (extracted) setPreviewId(extracted);
      } else if (calendarId) {
        setPreviewId(calendarId);
      }
    }
  }, [isOpen, isInitialized, calendarId, calendarUrlStore]);

  useEffect(() => {
    if (isOpen && courses.length > 0 && !selectedCourse) {
      let matchedCourse: Course | undefined;

      if (storedCourseId) {
        matchedCourse = courses.find((c) => c.id === storedCourseId);
      }

      if (!matchedCourse && calendarId) {
        matchedCourse = courses.find((c) => c.linkId === calendarId);
      }

      if (matchedCourse) {
        setSelectedCourse(matchedCourse);
        setActiveTab("select");
        if (!calendarUrlStore) {
          setPreviewId(matchedCourse.linkId);
        }
      }
    }
  }, [
    isOpen,
    courses,
    selectedCourse,
    storedCourseId,
    calendarId,
    calendarUrlStore,
  ]);

  const { data: availableSubjects, isLoading } =
    api.orario.getSubjects.useQuery(
      { linkId: previewId ?? "" },
      { enabled: !!previewId },
    );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCalendarUrl(url);
    setError(null);
    setCopiedLink(false);

    if (url.trim() === "") {
      setPreviewId(calendarId || null);
      return;
    }

    const extractedId = extractCalendarId(url);
    if (extractedId) {
      setPreviewId(extractedId);
    } else {
      setPreviewId(null);
    }
  };

  const handleCopyLink = async () => {
    const linkToCopy = calendarUrl || previewId || "";
    if (!linkToCopy) return;

    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Errore durante la copia:", err);
    }
  };

  const handleCopyCourseLink = async (
    linkId: string,
    courseId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(linkId);
      setCopiedCourseId(courseId);
      setTimeout(() => setCopiedCourseId(null), 2000);
    } catch (err) {
      console.error("Errore durante la copia:", err);
    }
  };

  const handleSave = async () => {
    if (!previewId) {
      setError("Inserisci un link valido del calendario Cineca.");
      return;
    }

    if (activeTab === "add" && !newCourseName.trim()) {
      setError("Inserisci il nome del corso.");
      return;
    }

    if (activeTab === "add" && newCourseYear === "") {
      setError("Specifica l'anno del corso.");
      return;
    }

    if (activeTab === "add" && newCourseName.trim()) {
      try {
        const newCourse = await addCourseMutation.mutateAsync({
          name: newCourseName.trim(),
          linkId: previewId,
          year: newCourseYear as number,
          academicYear: newAcademicYear || undefined,
          userId: userId,
          addedBy: "user",
        });

        setCalendarId(previewId);
        if (calendarUrl.includes("http")) {
          setCalendarUrlStore(calendarUrl);
        } else {
          setCalendarUrlStore("");
        }
        setCourseName(newCourseName.trim());
        setStoredCourseId(newCourse.id);
        onClose();
      } catch (error) {
        console.error("Errore durante l'aggiunta del corso:", error);
        return;
      }
    } else if (selectedCourse) {
      setCalendarId(previewId);
      if (calendarUrl.includes("http")) {
        setCalendarUrlStore(calendarUrl);
      } else {
        setCalendarUrlStore("");
      }
      setCourseName(selectedCourse.name);
      setStoredCourseId(selectedCourse.id);
      onClose();
    }
  };

  const toggleSubject = (subject: string) => {
    setHiddenSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  if (!isOpen && !forceOpen) return null;
  const canClose = !forceOpen || (forceOpen && calendarId);

  const CoursePanel = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black sticky top-0 z-10">
        <div className="flex border-b border-zinc-100 dark:border-zinc-900 -mx-6 px-6 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab("select")}
            className={cn(
              "py-4 px-4 text-sm font-bold border-b-2 transition-all relative font-serif",
              activeTab === "select"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Seleziona Corso</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className={cn(
              "py-4 px-4 text-sm font-bold border-b-2 transition-all relative font-serif",
              activeTab === "add"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
            )}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuovo Corso</span>
            </div>
          </button>
        </div>
        {activeTab === "select" ? (
          <div className="relative group">
            <input
              type="text"
              id="course-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Inizia a scrivere il nome del corso..."
              className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
          </div>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
        {activeTab === "select" ? (
          <div className="space-y-2.5">
            {courses
              .filter((course) =>
                course.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((course) => (
                <div key={course.id} className="relative group">
                  <button
                    type="button"
                    className={cn(
                      "w-full flex flex-col gap-2 p-4 pr-14 rounded-2xl border transition-all text-left relative overflow-hidden",
                      selectedCourse?.id === course.id
                        ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-lg shadow-zinc-200 dark:shadow-none"
                        : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    )}
                    onClick={() => {
                      setSelectedCourse(course);
                      setPreviewId(course.linkId);
                      setCalendarUrl("");
                      setError(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full border-2 transition-colors shrink-0",
                          selectedCourse?.id === course.id
                            ? "border-white dark:border-black bg-white dark:bg-black"
                            : "border-zinc-300 dark:border-zinc-700",
                        )}
                      />
                      <span
                        className={cn(
                          "font-bold text-sm truncate",
                          selectedCourse?.id === course.id
                            ? "text-white dark:text-black"
                            : "text-zinc-900 dark:text-white",
                        )}
                      >
                        {course.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 ml-5.5">
                      {course.year && (
                        <span
                          className={cn(
                            "text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight border font-mono",
                            selectedCourse?.id === course.id
                              ? "bg-white/10 border-white/20 text-white dark:text-black"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
                          )}
                        >
                          {course.year}° Anno
                        </span>
                      )}
                      {course.academicYear && (
                        <span
                          className={cn(
                            "text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tight border font-mono",
                            selectedCourse?.id === course.id
                              ? "bg-white/10 border-white/20 text-white dark:text-black"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
                          )}
                        >
                          {course.academicYear}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCourseLink(course.linkId, course.id, e);
                    }}
                    className={cn(
                      "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all shrink-0 z-10",
                      copiedCourseId === course.id
                        ? selectedCourse?.id === course.id
                          ? "bg-white/20 text-white dark:text-black"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : selectedCourse?.id === course.id
                          ? "bg-white/10 text-white dark:text-black hover:bg-white/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                    )}
                  >
                    {copiedCourseId === course.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-zinc-900 dark:bg-white rounded-3xl p-5 text-white dark:text-black shadow-xl relative overflow-hidden border border-white/10 dark:border-black/10">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 font-serif italic">
                  <Info className="w-4 h-4 opacity-70" />
                  <h4 className="text-xs font-bold uppercase tracking-widest">
                    Nota Bene
                  </h4>
                </div>
                <p className="text-sm font-medium leading-relaxed opacity-90 font-serif">
                  Il corso sarà in stato{" "}
                  <span className="underline decoration-2 underline-offset-4 font-bold">
                    In Attesa
                  </span>{" "}
                  fino all'approvazione. Potrai utilizzarlo subito, ma sarà
                  visibile agli altri solo dopo la verifica.
                </p>
              </div>
              <Plus className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="new-course-name"
                  className="text-xs font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
                >
                  Nome del Corso
                </label>
                <input
                  type="text"
                  id="new-course-name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Es: Informatica - Varese"
                  className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label
                    htmlFor="calendar-url"
                    className="text-xs font-bold text-zinc-500 uppercase font-mono tracking-tighter"
                  >
                    Link Calendario Cineca
                  </label>
                  {previewId && (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all uppercase tracking-tight font-mono",
                        copiedLink
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                      )}
                    >
                      {copiedLink ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedLink ? "Copiato" : "Copia"}
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    id="calendar-url"
                    value={calendarUrl}
                    onChange={handleUrlChange}
                    placeholder="Incolla l'URL completo del calendario..."
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all font-mono text-xs"
                  />
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="course-year-select"
                    className="block text-xs font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
                  >
                    Anno
                  </label>
                  <Select
                    value={newCourseYear === "" ? "" : String(newCourseYear)}
                    onValueChange={(value) =>
                      setNewCourseYear(value === "" ? "" : Number(value))
                    }
                  >
                    <SelectTrigger
                      id="course-year-select"
                      className="h-13 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 font-medium font-serif"
                    >
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {[1, 2, 3, 4, 5, 6].map((y) => (
                        <SelectItem
                          key={y}
                          value={String(y)}
                          className="rounded-xl font-serif"
                        >
                          {y}° Anno
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="academic-year-picker"
                    className="block text-xs font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
                  >
                    Anno Accademico
                  </label>
                  <AcademicYearPicker
                    id="academic-year-picker"
                    value={newAcademicYear}
                    onChange={setNewAcademicYear}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SubjectsPanel = () =>
    previewId && (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white dark:bg-black z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-serif">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Materie Rilevate
            </h3>
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
              {isLoading
                ? "Analisi..."
                : `${availableSubjects?.length || 0} materie`}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-2 animate-pulse pt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"
                />
              ))}
            </div>
          ) : availableSubjects && availableSubjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {availableSubjects.map((subject) => {
                const isHidden = hiddenSubjects.includes(subject);
                return (
                  <button
                    type="button"
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                      isHidden
                        ? "bg-zinc-50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-900 text-zinc-400"
                        : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-colors",
                        isHidden
                          ? "border-zinc-200 dark:border-zinc-800"
                          : "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white",
                      )}
                    >
                      {!isHidden && (
                        <Check className="w-3.5 h-3.5 text-white dark:text-black stroke-[3]" />
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold truncate flex-1 uppercase tracking-tight">
                      {subject.toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 rounded-3xl border-2 border-dashed border-zinc-100 dark:border-zinc-900 font-serif italic text-zinc-400 text-sm mt-2">
              Nessuna materia trovata per i prossimi 6 mesi.
            </div>
          )}
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 portrait:p-4 animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200",
          "portrait:max-w-xl portrait:h-[90vh]",
          "landscape:max-w-[80vw] landscape:h-[90vh]",
        )}
      >
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight font-serif">
                Configurazione
              </h2>
              <p className="text-xs text-zinc-500 font-medium font-serif italic opacity-80">
                Imposta il tuo percorso di studi
              </p>
            </div>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>

        {viewMode === "tabs" && (
          <div className="flex border-b border-zinc-100 dark:border-zinc-900 px-6 bg-white dark:bg-black flex-shrink-0">
            <button
              type="button"
              onClick={() => setSettingsTab("course")}
              className={cn(
                "py-4 px-4 text-sm font-bold border-b-2 transition-all relative font-serif",
                settingsTab === "course"
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              Corsi
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("subjects")}
              className={cn(
                "py-4 px-4 text-sm font-bold border-b-2 transition-all relative font-serif",
                settingsTab === "subjects"
                  ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
              )}
            >
              Materie
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === "split" ? (
            <>
              <div className="flex-1 flex flex-col min-h-0 border-b border-zinc-100 dark:border-zinc-900">
                <CoursePanel />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <SubjectsPanel />
              </div>
            </>
          ) : settingsTab === "course" ? (
            <CoursePanel />
          ) : (
            <SubjectsPanel />
          )}
        </div>

        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-3 flex-shrink-0">
          {error && (
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border border-red-100 dark:border-red-900/50 animate-in shake-1 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold tracking-tight font-serif">
                {error}
              </span>
            </div>
          )}
          <div className="flex gap-3">
            {onShowWelcome && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowWelcome();
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-black text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 py-3 rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-sm shadow-sm active:scale-[0.98] font-serif"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Novità</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!previewId}
              className="flex-[2] flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-2xl font-extrabold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg active:scale-[0.98] font-mono uppercase tracking-widest"
            >
              <Save className="w-4 h-4" />
              <span>Salva</span>
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/admin");
              }}
              className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Pannello Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
