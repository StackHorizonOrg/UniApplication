"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Info,
  Link2,
  Mail,
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
import { PushNotificationManager } from "@/components/PushNotificationManager";
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

const SPRING_CONFIG = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 1,
} as const;
const INITIAL_HIDDEN_SUBJECTS: string[] = [];

const panelVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
    scale: 0.98,
  }),
  visible: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 40 : -40,
    scale: 0.98,
  }),
};

interface CoursePanelProps {
  activeTab: "select" | "add";
  setActiveTab: (tab: "select" | "add") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  courses: Course[];
  selectedCourseIds: string[];
  toggleCourseSelection: (course: Course) => void;
  setError: (error: string | null) => void;
  copiedCourseId: string | null;
  handleCopyCourseLink: (
    linkId: string,
    courseId: string,
    e: React.MouseEvent,
  ) => void;
  newCourseName: string;
  setNewCourseName: (name: string) => void;
  previewIds: string[];
  handleCopyLink: () => void;
  copiedLink: boolean;
  calendarUrl: string;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newCourseYear: number | "";
  setNewCourseYear: (year: number | "") => void;
  newAcademicYear: string;
  setNewAcademicYear: (year: string) => void;
}

const CoursePanel = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  courses,
  selectedCourseIds,
  toggleCourseSelection,
  setError,
  copiedCourseId,
  handleCopyCourseLink,
  newCourseName,
  setNewCourseName,
  previewIds,
  handleCopyLink,
  copiedLink,
  calendarUrl,
  handleUrlChange,
  newCourseYear,
  setNewCourseYear,
  newAcademicYear,
  setNewAcademicYear,
}: CoursePanelProps) => (
  <motion.div
    key="course-panel"
    custom={1}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={panelVariants}
    transition={SPRING_CONFIG}
    className="flex flex-col h-full"
  >
    <div className="px-4 pt-4 pb-3 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-black sticky top-0 z-10">
      <p className="text-xs text-zinc-500 mb-3 px-1 font-serif italic">
        Scegli uno o più corsi dall'elenco o aggiungine uno nuovo se non è
        presente.
      </p>
      <div className="flex border-b border-zinc-100 dark:border-zinc-900 -mx-4 px-4 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("select")}
          className={cn(
            "pb-3 px-3 text-xs font-bold border-b-2 transition-all relative font-serif",
            activeTab === "select"
              ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300",
          )}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Seleziona Corsi</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("add")}
          className={cn(
            "pb-3 px-3 text-xs font-bold border-b-2 transition-all relative font-serif",
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
      {activeTab === "select" && (
        <div className="relative group">
          <input
            type="text"
            id="course-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca un corso..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm font-medium"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
        </div>
      )}
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
      {activeTab === "select" ? (
        <div className="space-y-2 pt-2">
          {courses
            .filter((course) =>
              course.name.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((course) => {
              const isSelected = selectedCourseIds.includes(course.id);
              return (
                <div key={course.id} className="relative group">
                  <div
                    className={cn(
                      "w-full flex flex-col gap-2 p-3 pr-12 rounded-xl border transition-all relative overflow-hidden",
                      isSelected
                        ? "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-md"
                        : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 cursor-pointer select-none outline-none text-left"
                      onClick={() => {
                        toggleCourseSelection(course);
                        setError(null);
                      }}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 transition-colors shrink-0 flex items-center justify-center",
                          isSelected
                            ? "border-white dark:border-black bg-white dark:bg-black"
                            : "border-zinc-300 dark:border-zinc-700",
                        )}
                      >
                        {isSelected && (
                          <Check
                            className={cn(
                              "w-3.5 h-3.5",
                              isSelected
                                ? "text-zinc-900 dark:text-white"
                                : "text-white dark:text-black",
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-bold text-xs truncate",
                          isSelected
                            ? "text-white dark:text-black"
                            : "text-zinc-900 dark:text-white",
                        )}
                      >
                        {course.name}
                      </span>
                    </button>

                    <div className="flex items-center justify-between ml-[28px]">
                      <div className="flex items-center gap-2">
                        {course.year && (
                          <span
                            className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight border font-mono",
                              isSelected
                                ? "bg-white/10 border-white/20 text-white dark:text-black"
                                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400",
                            )}
                          >
                            {course.year}° Anno
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="relative z-20">
                          <PushNotificationManager linkId={course.linkId} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCourseLink(course.linkId, course.id, e);
                    }}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all shrink-0 z-10",
                      copiedCourseId === course.id
                        ? isSelected
                          ? "bg-white/20 text-white dark:text-black"
                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : isSelected
                          ? "bg-white/10 text-white dark:text-black hover:bg-white/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white",
                    )}
                  >
                    {copiedCourseId === course.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="bg-zinc-900 dark:bg-white rounded-2xl p-4 text-white dark:text-black shadow-lg relative overflow-hidden border border-white/10 dark:border-black/10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 font-serif italic">
                <Info className="w-4 h-4 opacity-70" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">
                  Nota Bene
                </h4>
              </div>
              <p className="text-xs font-medium leading-relaxed opacity-90 font-serif">
                Il corso sarà in stato{" "}
                <span className="font-bold">In Attesa</span> fino
                all'approvazione. Potrai usarlo subito, ma sarà visibile agli
                altri solo dopo la verifica.
              </p>
            </div>
            <Plus className="absolute -right-2 -bottom-4 w-20 h-20 opacity-10 rotate-12" />
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="new-course-name"
                className="text-[10px] font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
              >
                Nome del Corso
              </label>
              <input
                type="text"
                id="new-course-name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Es: Informatica - Varese"
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label
                  htmlFor="calendar-url"
                  className="text-[10px] font-bold text-zinc-500 uppercase font-mono tracking-tighter"
                >
                  Link Calendario Cineca
                </label>
                {previewIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all uppercase tracking-tight font-mono",
                      copiedLink
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {copiedLink ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
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
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:outline-none transition-all font-mono text-xs"
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="course-year-select"
                  className="block text-[10px] font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
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
                    className="h-11 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 font-medium font-serif text-sm"
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

              <div className="space-y-1.5">
                <label
                  htmlFor="academic-year-picker"
                  className="block text-[10px] font-bold text-zinc-500 uppercase ml-1 font-mono tracking-tighter"
                >
                  Anno Accademico
                </label>
                <AcademicYearPicker
                  id="academic-year-picker"
                  value={newAcademicYear}
                  onChange={setNewAcademicYear}
                  className="h-11 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

interface SubjectsPanelProps {
  isLoading: boolean;
  availableSubjects: string[] | undefined;
  hiddenSubjects: string[];
  toggleSubject: (subject: string) => void;
}

const SubjectsPanel = ({
  isLoading,
  availableSubjects,
  hiddenSubjects,
  toggleSubject,
}: SubjectsPanelProps) => (
  <motion.div
    key="subjects-panel"
    custom={-1}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={panelVariants}
    transition={SPRING_CONFIG}
    className="flex flex-col h-full"
  >
    <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 sticky top-0 bg-white dark:bg-black z-10">
      <p className="text-xs text-zinc-500 mb-2 px-1 font-serif italic">
        Deseleziona le materie che non vuoi visualizzare nel tuo orario.
      </p>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-serif">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Materie Rilevate
        </h3>
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
          {isLoading
            ? "Analisi..."
            : `${availableSubjects?.length || 0} rilevate`}
        </span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 animate-pulse pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-zinc-100 dark:bg-zinc-900 rounded-xl"
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
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  isHidden
                    ? "bg-zinc-50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-900 text-zinc-400"
                    : "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98]",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors",
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
        <div className="text-center py-10 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-900 font-serif italic text-zinc-400 text-sm mt-2">
          Nessuna materia trovata per i prossimi 6 mesi.
        </div>
      )}
    </div>
  </motion.div>
);

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean;
}

export function SettingsDialog({
  isOpen,
  onClose,
  forceOpen = false,
}: SettingsDialogProps) {
  const router = useRouter();
  const [calendarIds, setCalendarIds] = useLocalStorage<string[]>(
    "calendarIds",
    [],
  );
  const [courseNames, setCourseNames] = useLocalStorage<string[]>(
    "courseNames",
    [],
  );
  const [courseIds, setCourseIds] = useLocalStorage<string[]>("courseIds", []);

  const [calendarId, setCalendarId] = useLocalStorage<string>("calendarId", "");
  const [courseName, setCourseName] = useLocalStorage<string>("courseName", "");
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
  const [previewIds, setPreviewIds] = useState<string[]>([]);

  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<"select" | "add">("select");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseYear, setNewCourseYear] = useState<number | "">("");
  const [newAcademicYear, setNewAcademicYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dialogStep, setDialogStep] = useState<"course" | "subjects">("course");

  const userId = useUserId();

  const { data: allCourses = [], refetch: refetchCourses } =
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

  const updateFiltersMutation =
    api.notifications.updateAllFilters.useMutation();

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (calendarIds.length === 0 && calendarId) {
        setCalendarIds([calendarId]);
        setCourseNames([courseName]);
        setCourseIds([storedCourseId]);
      }

      if (calendarUrlStore) {
        setCalendarUrl(calendarUrlStore);
        const extracted = extractCalendarId(calendarUrlStore);
        if (extracted) setPreviewIds([extracted]);
      } else if (calendarIds.length > 0) {
        setPreviewIds(calendarIds);
      } else if (calendarId) {
        setPreviewIds([calendarId]);
      }
      setIsInitialized(true);
    }
  }, [
    isOpen,
    isInitialized,
    calendarIds,
    calendarId,
    courseName,
    storedCourseId,
    calendarUrlStore,
    setCalendarIds,
    setCourseNames,
    setCourseIds,
  ]);

  useEffect(() => {
    if (isOpen && allCourses.length > 0 && selectedCourses.length === 0) {
      const activeIds =
        courseIds.length > 0
          ? courseIds
          : storedCourseId
            ? [storedCourseId]
            : [];
      const matchedCourses = allCourses.filter((c) => activeIds.includes(c.id));

      if (matchedCourses.length > 0) {
        setSelectedCourses(matchedCourses);
        setActiveTab("select");
      }
    }
  }, [isOpen, allCourses, selectedCourses.length, courseIds, storedCourseId]);

  const { data: availableSubjects, isLoading } =
    api.orario.getSubjects.useQuery(
      { linkIds: previewIds },
      { enabled: previewIds.length > 0 },
    );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCalendarUrl(url);
    setError(null);
    setCopiedLink(false);

    if (url.trim() === "") {
      setPreviewIds(
        calendarIds.length > 0 ? calendarIds : calendarId ? [calendarId] : [],
      );
      return;
    }

    const extractedId = extractCalendarId(url);
    if (extractedId) {
      setPreviewIds([extractedId]);
    } else {
      setPreviewIds([]);
    }
  };

  const toggleCourseSelection = (course: Course) => {
    setSelectedCourses((prev) => {
      const exists = prev.find((c) => c.id === course.id);
      if (exists) {
        const filtered = prev.filter((c) => c.id !== course.id);
        setPreviewIds(filtered.map((c) => c.linkId));
        return filtered;
      }
      const updated = [...prev, course];
      setPreviewIds(updated.map((c) => c.linkId));
      return updated;
    });
  };

  const handleCopyLink = async () => {
    const linkToCopy =
      calendarUrl || (previewIds.length > 0 ? previewIds[0] : "");
    if (!linkToCopy) return;

    try {
      await navigator.clipboard.writeText(linkToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (activeTab === "add") {
      if (previewIds.length === 0) {
        setError("Link calendario non valido.");
        return;
      }
      if (!newCourseName.trim()) {
        setError("Inserisci il nome del corso.");
        return;
      }
      if (newCourseYear === "") {
        setError("Specifica l'anno del corso.");
        return;
      }

      try {
        const newCourse = await addCourseMutation.mutateAsync({
          name: newCourseName.trim(),
          linkId: previewIds[0],
          year: newCourseYear as number,
          academicYear: newAcademicYear || undefined,
          userId: userId,
          addedBy: "user",
        });

        const newIds = [...calendarIds, previewIds[0]];
        const newNames = [...courseNames, newCourseName.trim()];
        const newCourseIds = [...courseIds, newCourse.id];

        setCalendarIds(newIds);
        setCourseNames(newNames);
        setCourseIds(newCourseIds);

        setCalendarId("");
        setCourseName("");
        setStoredCourseId("");

        setCalendarUrlStore(calendarUrl.includes("http") ? calendarUrl : "");
        onClose();
      } catch (error) {
        console.error(error);
      }
    } else {
      if (selectedCourses.length === 0) {
        setError("Seleziona almeno un corso.");
        return;
      }

      setCalendarIds(selectedCourses.map((c) => c.linkId));
      setCourseNames(selectedCourses.map((c) => c.name));
      setCourseIds(selectedCourses.map((c) => c.id));
      setCalendarId("");
      setCourseName("");
      setStoredCourseId("");
      onClose();
    }
  };

  const toggleSubject = (subject: string) => {
    const newHidden = hiddenSubjects.includes(subject)
      ? hiddenSubjects.filter((s) => s !== subject)
      : [...hiddenSubjects, subject];

    setHiddenSubjects(newHidden);

    if ("Notification" in window && Notification.permission === "granted") {
      updateFiltersMutation.mutate({ filters: newHidden });
    }
  };

  if (!isOpen && !forceOpen) return null;
  const hasConfigured = calendarIds.length > 0 || calendarId;
  const canClose = !forceOpen || (forceOpen && hasConfigured);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 portrait:p-4 animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200",
          "portrait:max-w-xl portrait:h-[90vh]",
          "landscape:max-w-xl landscape:h-[80vh]",
        )}
      >
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            {dialogStep === "subjects" && (
              <button
                type="button"
                onClick={() => setDialogStep("course")}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-500" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight font-serif">
                {dialogStep === "course"
                  ? "Configura Corsi"
                  : "Seleziona Materie"}
              </h2>
              <p className="text-xs text-zinc-500 font-medium font-serif italic opacity-80 -mt-0.5">
                Passo {dialogStep === "course" ? 1 : 2} di 2
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence
            mode="wait"
            custom={dialogStep === "course" ? 1 : -1}
          >
            {dialogStep === "course" ? (
              <CoursePanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                courses={allCourses}
                selectedCourseIds={selectedCourses.map((c) => c.id)}
                toggleCourseSelection={toggleCourseSelection}
                setError={setError}
                copiedCourseId={copiedCourseId}
                handleCopyCourseLink={handleCopyCourseLink}
                newCourseName={newCourseName}
                setNewCourseName={setNewCourseName}
                previewIds={previewIds}
                handleCopyLink={handleCopyLink}
                copiedLink={copiedLink}
                calendarUrl={calendarUrl}
                handleUrlChange={handleUrlChange}
                newCourseYear={newCourseYear}
                setNewCourseYear={setNewCourseYear}
                newAcademicYear={newAcademicYear}
                setNewAcademicYear={setNewAcademicYear}
              />
            ) : (
              <SubjectsPanel
                isLoading={isLoading}
                availableSubjects={availableSubjects}
                hiddenSubjects={hiddenSubjects}
                toggleSubject={toggleSubject}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col gap-2 flex-shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-100 dark:border-red-900/50">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold tracking-tight font-serif">
                {error}
              </span>
            </div>
          )}

          {dialogStep === "course" ? (
            <button
              type="button"
              onClick={() => setDialogStep("subjects")}
              disabled={previewIds.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-extrabold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg active:scale-[0.98] font-mono uppercase tracking-widest"
            >
              <span>Prosegui</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDialogStep("course")}
                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-black text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 py-2.5 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-xs shadow-sm active:scale-[0.98] font-serif"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Indietro</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={previewIds.length === 0}
                className="flex-[2] flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl font-extrabold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg active:scale-[0.98] font-mono uppercase tracking-widest"
              >
                <Save className="w-4 h-4" />
                <span>Salva e Chiudi</span>
              </button>
            </div>
          )}
          <div className="flex justify-center items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push("/admin");
              }}
              className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              <ShieldAlert className="w-2.5 h-2.5" />
              <span>Pannello Admin</span>
            </button>
            <a
              href="mailto:stefanomarocco0@gmail.com"
              className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              <Mail className="w-2.5 h-2.5" />
              <span>Suggerimenti</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
