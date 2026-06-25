import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const levelColor = {
  HTTP:  { bg: "bg-blue-500/15",    text: "text-blue-400",    dot: "bg-blue-400"    },
  INFO:  { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  ERROR: { bg: "bg-red-500/15",     text: "text-red-400",     dot: "bg-red-400"     },
  WARN:  { bg: "bg-amber-500/15",   text: "text-amber-400",   dot: "bg-amber-400"   },
};

const statusColor = (status) => {
  if (!status) return "text-slate-400";
  if (status < 300) return "text-emerald-400";
  if (status < 400) return "text-blue-400";
  if (status < 500) return "text-amber-400";
  return "text-red-400";
};

const fmt = (ts) => {
  if (!ts) return "";
  const [date, time] = ts.split(" ");
  return `${date} ${time}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:    "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    red:     "from-red-500/20 to-red-600/5 border-red-500/20",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    amber:   "from-amber-500/20 to-amber-600/5 border-amber-500/20",
  };
  const textColors = {
    blue: "text-blue-400", red: "text-red-400",
    emerald: "text-emerald-400", amber: "text-amber-400",
  };
  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br ${colors[color]} p-5 overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className={`text-3xl font-bold ${textColors[color]} mb-1`}>{value ?? "—"}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function MiniBar({ label, value, max, color = "blue" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColors = {
    blue: "bg-blue-500", emerald: "bg-emerald-500",
    red: "bg-red-500", amber: "bg-amber-500", purple: "bg-purple-500",
  };
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-36 text-xs text-slate-400 truncate text-right">{label}</div>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColors[color]} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs text-slate-300 text-left">{value}</div>
    </div>
  );
}

function ActivityChart({ data }) {
  if (!data?.length) return <div className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        const day = d.date.slice(5);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full">
              <div
                className="w-full bg-blue-500/30 hover:bg-blue-500/60 rounded-sm transition-all duration-300 cursor-default"
                style={{ height: `${Math.max(pct * 0.6, 4)}px` }}
                title={`${d.date}: ${d.count} حدث`}
              />
            </div>
            <span className="text-[9px] text-slate-500">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrendChart({ data }) {
  if (!data?.length) return (
    <div className="text-slate-500 text-sm text-center py-8">لا توجد بيانات للفترة المحددة</div>
  );
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => {
        const pct = Math.round((d.avg / 100) * 100);
        const barColor =
          d.avg >= 70 ? "bg-emerald-500/60 hover:bg-emerald-500" :
          d.avg >= 40 ? "bg-yellow-400/60 hover:bg-yellow-400" :
                        "bg-red-500/60 hover:bg-red-500";
        const day = d.date.slice(5);
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-400">{d.avg}%</span>
            <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-sm transition-all duration-500 cursor-default ${barColor}`}
                style={{ height: `${Math.max(pct * 0.8, 4)}px` }}
                title={`${d.date}: ${d.avg}% (${d.count} إجابة)`}
              />
            </div>
            <span className="text-[9px] text-slate-500">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function HistogramChart({ data, total }) {
  if (!data) return <div className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</div>;
  const buckets = [
    { key: "0-20",   label: "0-20%",   color: "bg-red-500",     text: "text-red-400"     },
    { key: "20-40",  label: "20-40%",  color: "bg-orange-500",  text: "text-orange-400"  },
    { key: "40-60",  label: "40-60%",  color: "bg-yellow-400",  text: "text-yellow-400"  },
    { key: "60-80",  label: "60-80%",  color: "bg-blue-500",    text: "text-blue-400"    },
    { key: "80-100", label: "80-100%", color: "bg-emerald-500", text: "text-emerald-400" },
  ];
  const max = Math.max(...buckets.map((b) => data[b.key] || 0), 1);
  return (
    <div className="flex items-end gap-3 h-32">
      {buckets.map((b) => {
        const val   = data[b.key] || 0;
        const pct   = Math.round((val / max) * 100);
        const ratio = total > 0 ? Math.round((val / total) * 100) : 0;
        return (
          <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-[10px] font-semibold ${b.text}`}>{val}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-700 ${b.color} opacity-70 hover:opacity-100`}
                style={{ height: `${Math.max(pct * 0.8, 4)}px` }}
                title={`${b.label}: ${val} إجابة (${ratio}%)`}
              />
            </div>
            <span className="text-[9px] text-slate-500">{b.label}</span>
            <span className="text-[9px] text-slate-600">{ratio}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Law Accuracy Chart ───────────────────────────────────────────────────────
const LAW_NAMES = {
  "Palestinian Basic Law":               "القانون الأساسي",
  "Palestinian Labor Law":               "قانون العمل",
  "Palestinian Civil Law":               "القانون المدني",
  "Palestinian Personal Status Law":     "الأحوال الشخصية",
  "Palestinian Criminal Procedure Law":  "الإجراءات الجزائية",
};

function LawAccuracyChart({ data }) {
  if (!data?.length) return (
    <div className="text-slate-500 text-sm text-center py-4">لا توجد بيانات</div>
  );
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const name = LAW_NAMES[item.law] || item.law;
        const colors = ["emerald","blue","purple","amber","red"];
        const barColors = {
          emerald: "bg-emerald-500", blue: "bg-blue-500",
          purple: "bg-purple-500",  amber: "bg-amber-500", red: "bg-red-500",
        };
        const textColors = {
          emerald: "text-emerald-400", blue: "text-blue-400",
          purple: "text-purple-400",   amber: "text-amber-400", red: "text-red-400",
        };
        const c = colors[i % colors.length];
        return (
          <div key={item.law}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-300 truncate">{name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{item.count} سؤال</span>
                <span className={`text-xs font-bold ${textColors[c]}`}>{item.avg}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColors[c]} transition-all duration-700`}
                style={{ width: `${item.avg}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard({ onBack }) {
  const [stats, setStats]               = useState(null);
  const [ragStats, setRagStats]         = useState(null);
  const [trendData, setTrendData]       = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [lawAccuracy, setLawAccuracy]   = useState([]);
  const [loadingTrend, setLoadingTrend]                   = useState(false);
  const [loadingDistribution, setLoadingDistribution]     = useState(true);
  const [loadingLawAccuracy, setLoadingLawAccuracy]       = useState(true);
  const [logs, setLogs]                 = useState([]);
  const [pagination, setPagination]     = useState({ total: 0, page: 1, pages: 1 });
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs]   = useState(true);
  const [error, setError]               = useState(null);

  const defaultTo   = new Date().toISOString().split("T")[0];
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate,   setToDate]   = useState(defaultTo);

  // fetch stats
  useEffect(() => {
    (async () => {
      try {
        setLoadingStats(true);
        const res = await fetch(`${API}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (e) { setError("تعذّر تحميل الإحصائيات"); }
      finally { setLoadingStats(false); }
    })();
  }, []);

  // fetch RAG accuracy stats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/admin/rag-stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) setRagStats(json.data);
      } catch (e) {}
    })();
  }, []);

  // fetch distribution
  useEffect(() => {
    (async () => {
      try {
        setLoadingDistribution(true);
        const res = await fetch(`${API}/api/admin/rag-distribution`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) setDistribution(json.data);
      } catch (e) {}
      finally { setLoadingDistribution(false); }
    })();
  }, []);

  // fetch law accuracy
  useEffect(() => {
    (async () => {
      try {
        setLoadingLawAccuracy(true);
        const res = await fetch(`${API}/api/admin/rag-by-law`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const json = await res.json();
        if (json.success) setLawAccuracy(json.data.laws);
      } catch (e) {}
      finally { setLoadingLawAccuracy(false); }
    })();
  }, []);

  // fetch trend
  const fetchTrend = useCallback(async () => {
    try {
      setLoadingTrend(true);
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate)   params.append("to",   toDate);
      const res = await fetch(`${API}/api/admin/rag-trend?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const json = await res.json();
      if (json.success) setTrendData(json.data.trend);
    } catch (e) {}
    finally { setLoadingTrend(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetchTrend(); }, []);

  // fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const type = filter === "ERROR" ? "error" : "combined";
      const res = await fetch(
        `${API}/api/admin/logs?type=${type}&page=${page}&limit=50`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const json = await res.json();
      if (json.success) { setLogs(json.data.logs); setPagination(json.data.pagination); }
    } catch (e) { setError("تعذّر تحميل السجلات"); }
    finally { setLoadingLogs(false); }
  }, [filter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const displayed = logs.filter((l) => {
    const matchLevel  = filter === "all" || l.level === filter;
    const matchSearch = !search ||
      l.message?.toLowerCase().includes(search.toLowerCase()) ||
      l.path?.toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const sc = stats?.statusCodes || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 overflow-y-auto" dir="rtl">

      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        ← رجوع للشات
      </button>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🛡️</span> لوحة التحكم
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">مراقبة النظام والسجلات — Pallaw</p>
        </div>
        <button
          onClick={() => { fetchLogs(); fetchTrend(); }}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-sm transition-colors"
        >🔄 تحديث</button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ── RAG Accuracy ── */}
      {ragStats && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">🎯 دقة الـ RAG — متوسط الصلة</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center min-w-[80px]">
              <div className={`text-4xl font-bold ${
                ragStats.avg >= 70 ? "text-emerald-400" :
                ragStats.avg >= 40 ? "text-yellow-400" : "text-red-400"
              }`}>{ragStats.avg}%</div>
              <div className="text-xs text-slate-500 mt-1">متوسط الدقة الكلي</div>
            </div>
            <div className="flex-1">
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    ragStats.avg >= 70 ? "bg-emerald-500" :
                    ragStats.avg >= 40 ? "bg-yellow-400" : "bg-red-500"
                  }`}
                  style={{ width: `${ragStats.avg}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{ragStats.high}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">دقة عالية ≥70%</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{ragStats.medium}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">دقة متوسطة ≥40%</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{ragStats.low}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">دقة منخفضة &lt;40%</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 text-left">إجمالي الإجابات المحللة: {ragStats.total}</div>
        </div>
      )}

      {/* ── Trend + Histogram row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-300">📈 تطور دقة الـ RAG يوم بيوم</h2>
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50" />
              <span className="text-slate-500 text-xs">←</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50" />
              <button onClick={fetchTrend}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl text-xs text-white transition-colors">
                احسب
              </button>
            </div>
          </div>
          <div className="flex gap-4 mb-3">
            {[
              { color: "bg-emerald-500", label: "عالية ≥70%" },
              { color: "bg-yellow-400",  label: "متوسطة ≥40%" },
              { color: "bg-red-500",     label: "منخفضة <40%" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-[10px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
          {loadingTrend ? (
            <div className="text-center text-slate-500 text-sm py-8">جارٍ التحميل...</div>
          ) : <TrendChart data={trendData} />}
          {trendData.length > 0 && (
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 border-t border-slate-800 pt-2">
              <span>إجمالي الأيام: {trendData.length}</span>
              <span>إجمالي الإجابات: {trendData.reduce((s, d) => s + d.count, 0)}</span>
              <span>متوسط الفترة: {Math.round(trendData.reduce((s, d) => s + d.avg, 0) / trendData.length)}%</span>
            </div>
          )}
        </div>

        {/* Histogram */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">📊 توزيع الـ Score</h2>
          {loadingDistribution ? (
            <div className="text-center text-slate-500 text-sm py-8">جارٍ التحميل...</div>
          ) : <HistogramChart data={distribution?.buckets} total={distribution?.total || 0} />}
          {distribution && (
            <div className="text-[10px] text-slate-500 mt-3 text-center border-t border-slate-800 pt-2">
              إجمالي الإجابات: {distribution.total}
            </div>
          )}
        </div>
      </div>

      {/* ── Law Accuracy ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">⚖️ دقة الـ RAG لكل قانون</h2>
        {loadingLawAccuracy ? (
          <div className="text-center text-slate-500 text-sm py-4">جارٍ التحميل...</div>
        ) : lawAccuracy.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">لا توجد بيانات</div>
        ) : (
          <>
            <LawAccuracyChart data={lawAccuracy} />
            <div className="text-[10px] text-slate-500 mt-3 border-t border-slate-800 pt-2 flex justify-between">
              <span>أعلى دقة: {LAW_NAMES[lawAccuracy[0]?.law] || lawAccuracy[0]?.law} — {lawAccuracy[0]?.avg}%</span>
              <span>أدنى دقة: {LAW_NAMES[lawAccuracy[lawAccuracy.length-1]?.law] || lawAccuracy[lawAccuracy.length-1]?.law} — {lawAccuracy[lawAccuracy.length-1]?.avg}%</span>
            </div>
          </>
        )}
      </div>

      {/* ── Stats cards ── */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="📋" label="إجمالي السجلات"      value={stats?.totalLogs?.toLocaleString()}   color="blue"    />
          <StatCard icon="🚨" label="الأخطاء"              value={stats?.totalErrors?.toLocaleString()} color="red"     />
          <StatCard icon="⚡" label="متوسط زمن الاستجابة" value={stats?.avgDuration ? `${stats.avgDuration} ms` : "—"} color="amber" />
          <StatCard icon="✅" label="نجاح الطلبات"         value={sc["2xx"] ?? "—"} sub={`${sc["3xx"] ?? 0} تحويل`}   color="emerald" />
        </div>
      )}

      {/* ── Charts row ── */}
      {!loadingStats && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">📈 النشاط اليومي (آخر 7 أيام)</h2>
            <ActivityChart data={stats.dailyActivity} />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">📊 رموز الحالة</h2>
            <div className="space-y-1">
              {[
                { label: "2xx نجاح",      value: sc["2xx"] || 0, color: "emerald" },
                { label: "3xx تحويل",     value: sc["3xx"] || 0, color: "blue"    },
                { label: "4xx خطأ عميل",  value: sc["4xx"] || 0, color: "amber"   },
                { label: "5xx خطأ سيرفر", value: sc["5xx"] || 0, color: "red"     },
              ].map((item) => (
                <MiniBar key={item.label} label={item.label} value={item.value}
                  max={Math.max(sc["2xx"]||0, sc["3xx"]||0, sc["4xx"]||0, sc["5xx"]||0, 1)}
                  color={item.color} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top endpoints ── */}
      {!loadingStats && stats?.topEndpoints?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">🔗 أكثر الـ Endpoints استخداماً</h2>
          <div className="space-y-1">
            {stats.topEndpoints.map((ep, i) => (
              <MiniBar key={ep.endpoint} label={ep.endpoint} value={ep.count}
                max={stats.topEndpoints[0]?.count || 1}
                color={["blue","purple","emerald","amber","red"][i % 5]} />
            ))}
          </div>
        </div>
      )}

      {/* ── Logs table ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-300 ml-2">📜 سجل الأحداث</h2>
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            {["all", "HTTP", "INFO", "ERROR"].map((f) => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filter === f ? "bg-slate-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}>{f === "all" ? "الكل" : f}</button>
            ))}
          </div>
          <input type="text" placeholder="بحث..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50" />
          <span className="text-xs text-slate-500 mr-auto">{pagination.total.toLocaleString()} سجل</span>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-slate-500 text-sm">جارٍ تحميل السجلات...</div>
        ) : displayed.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">لا توجد سجلات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="text-right px-4 py-2.5 font-medium w-36">التوقيت</th>
                  <th className="text-right px-3 py-2.5 font-medium w-20">النوع</th>
                  <th className="text-right px-3 py-2.5 font-medium w-16">الحالة</th>
                  <th className="text-right px-3 py-2.5 font-medium w-16">المدة</th>
                  <th className="text-right px-3 py-2.5 font-medium">الرسالة</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((log, i) => {
                  const lc = levelColor[log.level] || levelColor["INFO"];
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500 font-mono whitespace-nowrap">{fmt(log.timestamp)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${lc.bg} ${lc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lc.dot}`} />
                          {log.level}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-mono font-bold ${statusColor(log.status)}`}>{log.status || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono whitespace-nowrap">{log.duration ? `${log.duration}ms` : "—"}</td>
                      <td className="px-3 py-2.5 text-slate-300 max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.method && <span className="text-slate-500 ml-1">{log.method}</span>}
                          {log.path   && <span className="text-blue-400 ml-1">{log.path}</span>}
                          {log.message}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition-colors">
              ← السابق
            </button>
            <span className="text-xs text-slate-400">صفحة {page} من {pagination.pages}</span>
            <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs transition-colors">
              التالي →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}