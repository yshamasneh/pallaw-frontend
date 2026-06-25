import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";
import ReactMarkdown from "react-markdown";

export function speakArabicEnglish(text, { onEnd, onError } = {}) {
  window.speechSynthesis.cancel();
  if (!text || !text.trim()) {
    onEnd?.();
    return;
  }

  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`(.*?)`/g, "$1")
    .replace(/[_~]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, "");

  const parts = cleanText
    .split(/([0-9A-Za-z][0-9A-Za-z%.,/-]*)/g)
    .filter((p) => p.trim() !== "");

  if (parts.length === 0) {
    onEnd?.();
    return;
  }

  let i = 0;
  const speakNext = () => {
    if (i >= parts.length) {
      onEnd?.();
      return;
    }
    const part = parts[i];
    const isLatinNumeric = /^[0-9A-Za-z][0-9A-Za-z%.,/-]*$/.test(part);
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = isLatinNumeric ? "en-US" : "ar-SA";
    utterance.rate = 1.15;
    utterance.onend = () => {
      i += 1;
      speakNext();
    };
    utterance.onerror = () => {
      i += 1;
      speakNext();
    };
    window.speechSynthesis.speak(utterance);
  };

  speakNext();
}

export function stopSpeaking() {
  window.speechSynthesis.pause();
  window.speechSynthesis.cancel();
}

function ChatMessage({ role, text, relevanceScore, onEdit }) {
  const isUser = role === "user";
  const { isDark } = useTheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakArabicEnglish(text, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleEditSave = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`flex gap-3 mb-6 animate-slide-up ${isUser ? "flex-row" : "flex-row-reverse"}`}
      dir="rtl"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/30 ring-2 ring-white/10">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full blur-md opacity-40" />
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-base shadow-lg shadow-emerald-500/30 ring-2 ring-white/10">
              ⚖️
            </div>
          </div>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`flex flex-col max-w-[85%] md:max-w-[78%] ${isUser ? "items-start" : "items-end"}`}
      >
        {/* Label */}
        <div
          className={`text-xs font-semibold mb-1.5 px-1 ${isUser ? "text-blue-400" : "text-emerald-500"}`}
        >
          {isUser ? "أنت" : "المساعد القانوني"}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-6 py-4 rounded-2xl shadow-md ${
            isUser
              ? isDark
                ? "bg-gradient-to-br from-blue-600/25 to-indigo-700/25 border border-blue-500/25 rounded-tr-sm shadow-lg shadow-blue-900/30"
                : "bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-tr-sm"
              : isDark
                ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/10 rounded-tl-sm shadow-lg shadow-black/30"
                : "bg-white border border-slate-200 rounded-tl-sm shadow-sm"
          }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={`w-full bg-transparent text-lg md:text-[19px] leading-[2] resize-none focus:outline-none ${
                  isDark ? "text-slate-100" : "text-slate-800"
                }`}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className={`text-xs px-3 py-1 rounded-lg ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleEditSave}
                  className="text-xs px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                >
                  إرسال
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p
              className={`text-lg md:text-[19px] leading-[2] whitespace-pre-wrap tracking-wide ${
                isDark ? "text-slate-100" : "text-slate-800"
              }`}
            >
              {text}
            </p>
          ) : (
            <div
              className={`prose prose-sm max-w-none text-lg md:text-[18px] leading-[2] tracking-wide ${
                isDark
                  ? "prose-invert text-slate-100 prose-strong:text-white prose-p:my-2"
                  : "text-slate-800 prose-strong:text-slate-900 prose-p:my-2"
              }`}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-1.5 px-1">
          {!isUser && (
            <button
              onClick={handleSpeak}
              title={isSpeaking ? "إيقاف القراءة" : "قراءة الرد بصوت"}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
                isSpeaking
                  ? isDark
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-emerald-100 text-emerald-600"
                  : isDark
                    ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              {isSpeaking ? (
                <svg
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9.172 16.828A4 4 0 016 13V11a4 4 0 013.172-3.828"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a6 6 0 00-12 0"
                  />
                </svg>
              )}
              <span>{isSpeaking ? "إيقاف" : "استماع"}</span>
            </button>
          )}

          {isUser && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              title="تعديل السؤال"
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all ${
                isDark
                  ? "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>تعديل</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
