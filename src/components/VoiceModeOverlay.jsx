import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext.jsx";

// Voice Mode: continuous voice input overlay.
// - Listens continuously while open.
// - When a final transcript arrives, it's sent immediately via onSend.
function VoiceModeOverlay({ onSend, isTyping, onClose }) {
  const { isDark } = useTheme();
  const [voiceSupported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
  );
  const [status, setStatus] = useState("listening");
  const [liveTranscript, setLiveTranscript] = useState("");

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(true);

  // ─── Setup continuous Speech Recognition ──────────────────────────────────
  useEffect(() => {
    if (!voiceSupported) return;

    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ar";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalText.trim()) {
        setLiveTranscript("");
        setStatus("thinking");
        onSend(finalText.trim());
      } else {
        setLiveTranscript(interim);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "aborted") {
        // brief backoff before restart attempt
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          /* already started, ignore */
        }
      }
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    try {
      recognition.start();
    } catch {
      /* ignore */
    }
    setStatus("listening");

    return () => {
      shouldListenRef.current = false;
      recognition.onend = null;
      recognition.abort();
    };
  }, [voiceSupported, onSend]);

  // ─── Reflect "thinking" status while a backend request is in flight ───────
  useEffect(() => {
    if (isTyping) setStatus("thinking");
    else setStatus("listening");
  }, [isTyping]);

  const handleClose = useCallback(() => {
    shouldListenRef.current = false;
    recognitionRef.current?.abort();
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  if (!voiceSupported) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        dir="rtl"
      >
        <div
          className={`rounded-2xl p-6 max-w-sm text-center ${isDark ? "bg-slate-900 border border-white/10 text-slate-200" : "bg-white text-slate-800"}`}
        >
          <p className="mb-4">المحادثة الصوتية غير مدعومة في هذا المتصفح.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    listening: { label: "جارٍ الاستماع...", color: "emerald" },
    thinking: { label: "جارٍ البحث في النصوص القانونية...", color: "amber" },
    idle: { label: "اضغط للبدء", color: "slate" },
  }[status] || { label: "جارٍ الاستماع...", color: "emerald" };

  const ringColors = {
    emerald: "from-emerald-500 to-cyan-500 shadow-emerald-500/40",
    amber: "from-amber-500 to-orange-500 shadow-amber-500/40",
    slate: "from-slate-500 to-slate-600 shadow-slate-500/30",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
        isDark ? "bg-slate-950/95" : "bg-white/95"
      } backdrop-blur-md`}
      dir="rtl"
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        title="إغلاق (Esc)"
        className={`absolute top-6 left-6 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          isDark
            ? "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20"
            : "bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Title */}
      <div
        className={`absolute top-6 right-6 text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
      >
        🗣️ المحادثة الصوتية
      </div>

      {/* Central orb */}
      <div className="relative flex items-center justify-center mb-8">
        {status === "listening" && (
          <>
            <div
              className={`absolute w-48 h-48 rounded-full bg-gradient-to-br ${ringColors[statusConfig.color]} opacity-20 animate-ping`}
            />
            <div
              className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${ringColors[statusConfig.color]} opacity-25 animate-pulse`}
            />
          </>
        )}
        {status === "thinking" && (
          <div
            className={`absolute w-44 h-44 rounded-full bg-gradient-to-br ${ringColors[statusConfig.color]} opacity-20 animate-spin`}
            style={{ animationDuration: "3s" }}
          />
        )}

        {/* Core orb */}
        <div
          className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${ringColors[statusConfig.color]} shadow-2xl flex items-center justify-center transition-all duration-500`}
        >
          {status === "thinking" ? (
            <svg
              className="w-12 h-12 text-white animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 9a3 3 0 116 0v3a3 3 0 11-6 0V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 11a7 7 0 0014 0M12 18v3"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Status label */}
      <div
        className={`text-lg font-semibold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}
      >
        {statusConfig.label}
      </div>

      {/* Live transcript */}
      <div className="min-h-[3rem] max-w-2xl px-8 text-center">
        {liveTranscript && (
          <p
            className={`text-xl leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {liveTranscript}
          </p>
        )}
      </div>

      {/* Hint */}
      <div
        className={`absolute bottom-8 text-xs text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        تحدّث في أي وقت — اضغط Esc للإغلاق
      </div>
    </div>
  );
}

export default VoiceModeOverlay;