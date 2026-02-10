import {
  AlertCircle,
  Check,
  Copy,
  Plus,
  Save,
  Search,
  Sparkles,
  X,
} from "lucide-react";
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
  const [calendarId, setCalendarId] = useLocalStorage<string>("calendarId", "");
  const [_courseName, setCourseName] = useLocalStorage<string>(
    "courseName",
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
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseYear, setNewCourseYear] = useState<number | "">("");
  const [newAcademicYear, setNewAcademicYear] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const userId = useUserId();

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
    if (isOpen) {
      if (calendarUrlStore) {
        setCalendarUrl(calendarUrlStore);
        const extracted = extractCalendarId(calendarUrlStore);
        if (extracted) setPreviewId(extracted);
      } else if (calendarId) {
        setPreviewId(calendarId);
      }

      if (calendarId && courses.length > 0) {
        const matchedCourse = courses.find((c) => c.linkId === calendarId);
        if (matchedCourse) {
          setSelectedCourse(matchedCourse);
          setIsManualEntry(false);
        } else {
          setIsManualEntry(true);
        }
      }
    }
  }, [isOpen, calendarId, calendarUrlStore, courses]);

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

  const handleSave = async () => {
    if (!previewId) {
      setError("Inserisci un link valido del calendario Cineca.");
      return;
    }

    if (isManualEntry && !newCourseName.trim()) {
      setError("Inserisci il nome del corso.");
      return;
    }

    if (isManualEntry && newCourseYear === "") {
      setError("Specifica l'anno del corso.");
      return;
    }

    if (isManualEntry && newCourseName.trim()) {
      try {
        await addCourseMutation.mutateAsync({
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
        }
        setCourseName(newCourseName.trim());
        onClose();
      } catch (error) {
        console.error("Errore durante l'aggiunta del corso:", error);
        return;
      }
    } else if (selectedCourse) {
      setCalendarId(previewId);
      if (calendarUrl.includes("http")) {
        setCalendarUrlStore(calendarUrl);
      }
      setCourseName(selectedCourse.name);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">
              Configurazione
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Imposta il calendario universitario
            </p>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleziona il tuo Corso
              </h3>
              <span className="text-xs text-gray-400">
                {courses.length} disponibili
              </span>
            </div>

            {courses.length > 3 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca corso..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            )}

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {courses
                .filter((course) =>
                  course.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsManualEntry(false);
                      setPreviewId(course.linkId);
                      setCalendarUrl("");
                      setError(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      selectedCourse?.id === course.id && !isManualEntry
                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                        : "bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-gray-700",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0",
                        selectedCourse?.id === course.id && !isManualEntry
                          ? "border-white dark:border-black bg-white dark:bg-black"
                          : "border-gray-300 dark:border-gray-700",
                      )}
                    >
                      {selectedCourse?.id === course.id && !isManualEntry && (
                        <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {course.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {course.year && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            {course.year}° Anno
                          </span>
                        )}
                        {course.academicYear && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300">
                            {course.academicYear}
                          </span>
                        )}
                        {course.status === "pending" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-300">
                            ⏳ In Attesa
                          </span>
                        )}
                        {course.status === "rejected" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
                            ✕ Rifiutato
                          </span>
                        )}
                        {course.verified && course.status === "approved" && (
                          <span className="text-xs opacity-70">
                            ✓ Verificato
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

              <button
                type="button"
                onClick={() => {
                  setIsManualEntry(true);
                  setSelectedCourse(null);
                  setPreviewId(null);
                  setCalendarUrl("");
                  setNewCourseName("");
                  setNewCourseYear("");
                  setNewAcademicYear("");
                  setError(null);
                  setCopiedLink(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                  isManualEntry
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                    : "bg-white dark:bg-black border-dashed border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-400 dark:hover:border-gray-600",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0",
                    isManualEntry
                      ? "border-white dark:border-black bg-white dark:bg-black"
                      : "border-gray-300 dark:border-gray-700",
                  )}
                >
                  {isManualEntry && (
                    <div className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    Aggiungi nuovo corso
                  </span>
                </div>
              </button>
            </div>
          </div>

          {isManualEntry && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                <p className="text-xs text-blue-900 dark:text-blue-300">
                  Il corso sarà in stato "In Attesa" fino all'approvazione da
                  parte di un amministratore. Potrai utilizzarlo subito, ma sarà
                  visibile agli altri utenti solo dopo l'approvazione.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label
                    htmlFor="course-name-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nome del Corso *
                  </label>
                  <input
                    id="course-name-input"
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Es: Informatica - Varese"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all text-sm"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="course-year-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Anno del Corso *
                  </label>
                  <Select
                    value={newCourseYear === "" ? "" : String(newCourseYear)}
                    onValueChange={(value) =>
                      setNewCourseYear(value === "" ? "" : Number(value))
                    }
                  >
                    <SelectTrigger
                      id="course-year-input"
                      className="bg-gray-50 dark:bg-gray-900"
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

                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="academic-year-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Anno Accademico
                  </label>
                  <AcademicYearPicker
                    value={newAcademicYear}
                    onChange={setNewAcademicYear}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="calendar-url-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Link Pubblico Calendario (Cineca) *
                  </label>
                  {(calendarUrl || previewId) && (
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                        copiedLink
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700",
                      )}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copiato!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copia Link
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="calendar-url-input"
                    type="text"
                    value={calendarUrl}
                    onChange={handleUrlChange}
                    placeholder="https://.../getImpegniCalendarioPubblico?linkCalendarioId=..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all font-mono text-xs"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Incolla l'URL completo del calendario pubblico fornito
                  dall'università
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {previewId && (
            <div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="subjects-preview"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Materie Rilevate
                </label>
                <span className="text-xs text-gray-400 font-mono">
                  {isLoading
                    ? "Caricamento..."
                    : `${availableSubjects?.length || 0} trovate`}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    />
                  ))}
                </div>
              ) : availableSubjects && availableSubjects.length > 0 ? (
                <div
                  id="subjects-preview"
                  className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2"
                >
                  {availableSubjects.map((subject) => {
                    const isHidden = hiddenSubjects.includes(subject);
                    return (
                      <button
                        type="button"
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                          isHidden
                            ? "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-400"
                            : "bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-300 dark:hover:border-gray-700",
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                            isHidden
                              ? "border-gray-300 dark:border-gray-700"
                              : "bg-black dark:bg-white border-black dark:border-white",
                          )}
                        >
                          {!isHidden && (
                            <Check className="w-3 h-3 text-white dark:text-black" />
                          )}
                        </div>
                        <span className="text-xs font-mono truncate flex-1 uppercase">
                          {subject.toLowerCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  Nessuna materia trovata per i prossimi 6 mesi.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
          {onShowWelcome && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onShowWelcome();
              }}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 py-2.5 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Rivedi Novità V2
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewId}
            className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Salva e Continua
          </button>
        </div>
      </div>
    </div>
  );
}
