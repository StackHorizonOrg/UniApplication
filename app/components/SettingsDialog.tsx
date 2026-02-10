import { AlertCircle, Check, Save, Search, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLocalStorage } from "@/lib/hooks";
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

  useEffect(() => {
    if (isOpen) {
      if (calendarUrlStore) {
        setCalendarUrl(calendarUrlStore);
        const extracted = extractCalendarId(calendarUrlStore);
        if (extracted) setPreviewId(extracted);
      } else if (calendarId) {
        setPreviewId(calendarId);
      }
    }
  }, [isOpen, calendarId, calendarUrlStore]);

  const { data: availableSubjects, isLoading } =
    api.orario.getSubjects.useQuery(
      { linkId: previewId ?? "" },
      { enabled: !!previewId },
    );

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCalendarUrl(url);
    setError(null);

    if (url.trim() === "") {
      setPreviewId(calendarId || null);
      return;
    }

    const extractedId = extractCalendarId(url);
    if (extractedId) {
      setPreviewId(extractedId);
    }
  };

  const handleSave = () => {
    if (!previewId) {
      setError("Inserisci un link valido del calendario Cineca.");
      return;
    }

    setCalendarId(previewId);

    if (calendarUrl.includes("http")) {
      setCalendarUrlStore(calendarUrl);
    }
    onClose();
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
        {}
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

        {}
        <div className="p-6 overflow-y-auto space-y-6">
          {}
          <div className="space-y-3">
            <label
              htmlFor="calendar-url-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Link Pubblico Calendario (Cineca)
            </label>
            <div className="relative">
              <input
                id="calendar-url-input"
                type="text"
                value={calendarUrl}
                onChange={handleUrlChange}
                placeholder="https://.../getImpegniCalendarioPubblico?linkCalendarioId=..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-all font-mono text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Incolla qui l'URL completo del calendario pubblico fornito
              dall'università.
            </p>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {}
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

        {}
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
