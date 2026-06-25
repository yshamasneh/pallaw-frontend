import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext.jsx";

function ChatInput({ onSend, disabled = false, onOpenVoiceMode }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  // Snapshot of text when mic starts — new speech appends after it
  const baseTextRef = useRef("");
  const { isDark } = useTheme();

  // ─── Auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [text]);

  // ─── Setup Speech Recognition ─────────────────────────────────────────────
  useEffect(() => {
    if (!voiceSupported) return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "ar";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = baseTextRef.current;
      const separator = base && !base.endsWith(" ") && !base.endsWith("\n") ? " " : "";
      setText(base + separator + transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => { recognition.abort(); };
  }, [voiceSupported]);

  

  // ─── Toggle Mic ───────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.abort();
      setIsListening(false);
    } else {
      baseTextRef.current = text;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (text.trim() === "" || disabled) return;
    onSend(text.trim());
    setText("");
    baseTextRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = text.trim() === "";
  const charCount = text.length;
  const maxChars = 2000;

  return (
    <div className={`px-6 py-4 relative z-10 flex-shrink-0 ${isDark ? "" : "bg-white border-t border-slate-200"}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`relative group transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
          <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 blur-lg transition-opacity duration-500 ${isFocused && isDark ? "opacity-30" : ""}`} />

          <div className={`relative rounded-2xl border transition-all duration-300 ${
            isDark
              ? isFocused ? "glass-card border-blue-500/40 shadow-lg shadow-blue-500/10" : "glass-card border-white/10"
              : isFocused ? "bg-white border-blue-400 shadow-lg shadow-blue-100" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <div className="flex items-end gap-3 p-3" dir="rtl">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isListening ? "🎤 جارٍ الاستماع..." : "اكتب سؤالك القانوني هنا..."}
                  rows={1}
                  maxLength={maxChars}
                  disabled={disabled}
                  className={`w-full bg-transparent text-base md:text-[19px] leading-[1.8] tracking-wide resize-none focus:outline-none px-3 py-2.5 max-h-[180px] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
                  }`}
                  style={{ minHeight: "48px" }}
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mic Button */}
                {voiceSupported && (
                  <button
                    onClick={toggleMic}
                    disabled={disabled}
                    title={isListening ? "إيقاف الاستماع" : "تحدث بسؤالك"}
                    className={`relative flex-shrink-0 transition-all duration-300 ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-105"}`}
                  >
                    {isListening && (
                      <div className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-30" />
                    )}
                    <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                      isListening
                        ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40"
                        : isDark
                          ? "bg-white/8 border border-white/15 hover:border-emerald-500/40"
                          : "bg-slate-100 border border-slate-200 hover:border-emerald-400"
                    }`}>
                      {isListening ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )}

                

               
              

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={isEmpty || disabled}
                  className={`group/btn relative flex-shrink-0 transition-all duration-300 ${isEmpty || disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
                >
                  {!isEmpty && !disabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50 group-hover/btn:opacity-75 transition-opacity" />
                  )}
                  <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                    isEmpty || disabled
                      ? isDark ? "bg-white/5 border border-white/10" : "bg-slate-100 border border-slate-200"
                      : "bg-gradient-to-br from-blue-500 to-purple-500 shadow-blue-500/30"
                  }`}>
                    {disabled ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${isEmpty ? (isDark ? "text-slate-500" : "text-slate-400") : "text-white"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between px-5 py-2 border-t ${isDark ? "border-white/5" : "border-slate-100"}`} dir="rtl">
              <div className={`flex items-center gap-2 text-[13px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <kbd className={`px-2 py-1 rounded font-mono text-[11px] ${isDark ? "bg-white/5 border border-white/10 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-500"}`}>Enter</kbd>
                <span>للإرسال</span>
                <span className={`mx-1 ${isDark ? "text-slate-700" : "text-slate-300"}`}>·</span>
                <kbd className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${isDark ? "bg-white/5 border border-white/10 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-500"}`}>Shift+Enter</kbd>
                <span>سطر جديد</span>
                {voiceSupported && (
                  <>
                    <span className={`mx-1 ${isDark ? "text-slate-700" : "text-slate-300"}`}>·</span>
                    <span>🎤 للإرسال الصوتي</span>
                  </>
                )}
              </div>
              {charCount > 0 && (
                <div className={`text-[13px] font-mono ${charCount > maxChars * 0.9 ? "text-orange-400" : isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {charCount} / {maxChars}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className={`text-center text-xs mt-3 leading-relaxed ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          المساعد القانوني قد يقدم معلومات غير دقيقة. تحقق دائماً من المعلومات الحساسة.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;