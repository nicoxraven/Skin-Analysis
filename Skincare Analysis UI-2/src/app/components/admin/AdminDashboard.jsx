import { useEffect, useMemo, useState } from "react";
import { Users, Activity, Package, Star, TrendingUp, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { getAdminDashboard } from "../../../services/api";

const inputCls = "bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary";

const PALETTE = {
  primary: "#6B3A52",
  accent: "#C4859A",
  muted: "#8C7B75",
  grid: "rgba(107, 58, 82, 0.08)",
  series: ["#C4859A", "#7A9E87", "#6B8EAF", "#D4A843", "#A67856", "#6B3A52"],
};

const DIMENSIONS = [
  { id: "age_group", label: "Age group" },
  { id: "skinType", label: "Skin condition" },
  { id: "score_band", label: "Score band" },
  { id: "date", label: "Date" },
];

const METRICS = [
  { id: "count", label: "Scan count" },
  { id: "avg_score", label: "Avg skin score" },
];

const CHART_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "hbar", label: "H-Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
];

const AGE_ORDER = ["Under 18", "18–24", "25–34", "35–44", "45+", "Unknown"];
const SCORE_BANDS = ["0–40", "41–60", "61–75", "76–90", "91–100"];

function ageGroup(age) {
  if (age == null || Number.isNaN(Number(age))) return "Unknown";
  const n = Number(age);
  if (n < 18) return "Under 18";
  if (n <= 24) return "18–24";
  if (n <= 34) return "25–34";
  if (n <= 44) return "35–44";
  return "45+";
}

function scoreBand(score) {
  const s = Number(score) || 0;
  if (s <= 40) return "0–40";
  if (s <= 60) return "41–60";
  if (s <= 75) return "61–75";
  if (s <= 90) return "76–90";
  return "91–100";
}

function dimKey(row, dim) {
  if (dim === "age_group") return ageGroup(row.age);
  if (dim === "score_band") return scoreBand(row.score);
  if (dim === "date") return row.date || "Unknown";
  return row.skinType || "Unknown";
}

function aggregate(rows, dim, metric) {
  const map = {};
  for (const row of rows) {
    const key = dimKey(row, dim);
    if (!map[key]) map[key] = { name: key, count: 0, _sum: 0 };
    map[key].count += 1;
    map[key]._sum += Number(row.score) || 0;
  }
  let list = Object.values(map).map((v) => ({
    name: v.name,
    count: v.count,
    avg_score: v.count ? Math.round((v._sum / v.count) * 10) / 10 : 0,
  }));

  if (dim === "age_group") {
    list.sort((a, b) => AGE_ORDER.indexOf(a.name) - AGE_ORDER.indexOf(b.name));
  } else if (dim === "score_band") {
    list.sort((a, b) => SCORE_BANDS.indexOf(a.name) - SCORE_BANDS.indexOf(b.name));
  } else if (dim === "date") {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  } else {
    list.sort((a, b) => b.count - a.count);
  }

  return list.map((d) => ({ ...d, value: d[metric] }));
}

function ChartTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const metricLabel = METRICS.find((m) => m.id === metric)?.label || metric;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-foreground mb-1">{row?.name ?? label}</p>
      <p className="text-muted-foreground">
        {metricLabel}: <span className="font-mono font-semibold text-foreground">{row?.value ?? payload[0]?.value}</span>
      </p>
      {metric !== "count" && (
        <p className="text-muted-foreground mt-0.5">Scans: <span className="font-mono text-foreground">{row?.count}</span></p>
      )}
    </div>
  );
}

function ExplorerChart({ data, chartType, metric }) {
  const empty = !data.length;
  if (empty) {
    return <p className="text-sm text-muted-foreground py-16 text-center">No data for this selection.</p>;
  }

  const axisProps = {
    tick: { fontSize: 11, fill: PALETTE.muted },
    axisLine: { stroke: PALETTE.grid },
    tickLine: false,
  };
  const grid = <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />;
  const tip = <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ fill: "rgba(107,58,82,0.04)" }} />;
  const fill = PALETTE.accent;
  const stroke = PALETTE.primary;

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={PALETTE.series[i % PALETTE.series.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip metric={metric} />} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "hbar") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
          {grid}
          <XAxis type="number" {...axisProps} allowDecimals={metric === "count"} />
          <YAxis type="category" dataKey="name" width={88} {...axisProps} />
          {tip}
          <Bar dataKey="value" fill={fill} radius={[0, 4, 4, 0]} maxBarSize={18} name={metric} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          {grid}
          <XAxis dataKey="name" {...axisProps} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 52 : 30} />
          <YAxis {...axisProps} allowDecimals={metric !== "count"} width={36} />
          {tip}
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={{ r: 3, fill: stroke, strokeWidth: 0 }} activeDot={{ r: 5 }} name={metric} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barCategoryGap="28%">
        {grid}
        <XAxis dataKey="name" {...axisProps} interval={0} angle={data.length > 6 ? -25 : 0} textAnchor={data.length > 6 ? "end" : "middle"} height={data.length > 6 ? 52 : 30} />
        <YAxis {...axisProps} allowDecimals={metric !== "count"} width={36} />
        {tip}
        <Bar dataKey="value" fill={fill} radius={[4, 4, 0, 0]} maxBarSize={28} name={metric} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ data, dataKey = "count", nameKey = "name", color = PALETTE.accent, height = 200 }) {
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground py-12 text-center">No data</p>;
  }
  const axisProps = {
    tick: { fontSize: 10, fill: PALETTE.muted },
    axisLine: false,
    tickLine: false,
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }} barCategoryGap="32%">
        <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />
        <XAxis dataKey={nameKey} {...axisProps} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? "end" : "middle"} height={data.length > 5 ? 48 : 28} />
        <YAxis {...axisProps} allowDecimals={false} width={28} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(107,58,82,0.12)", fontSize: 12 }} cursor={{ fill: "rgba(107,58,82,0.04)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Derive top concern (most frequent skinType across all analyses)
function topConcern(analyses) {
  const map = {};
  for (const a of analyses) {
    const k = a.skinType || "Unknown";
    map[k] = (map[k] || 0) + 1;
  }
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "—";
}

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [xDim, setXDim] = useState("age_group");
  const [yMetric, setYMetric] = useState("count");
  const [chartType, setChartType] = useState("bar");

  const load = async () => {
    setLoading(true);
    const d = await getAdminDashboard({});
    setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const m = data?.metrics || {};
  const analyses = data?.analyses || [];

  const explorerData = useMemo(
    () => aggregate(analyses, xDim, yMetric),
    [analyses, xDim, yMetric],
  );

  const skinShare = useMemo(() => {
    return (data?.by_skin_type || []).map((r) => ({
      name: r.skinType,
      value: r.count,
      count: r.count,
    }));
  }, [data]);

  const dailyTimeline = useMemo(() => {
    const map = {};
    for (const row of analyses) {
      const d = row.date || "Unknown";
      if (!map[d]) map[d] = { name: d, count: 0, _sum: 0 };
      map[d].count += 1;
      map[d]._sum += Number(row.score) || 0;
    }
    return Object.values(map)
      .map((v) => ({
        name: v.name,
        count: v.count,
        avg_score: v.count ? Math.round((v._sum / v.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [analyses]);

  const dimLabel = DIMENSIONS.find((d) => d.id === xDim)?.label;
  const metricLabel = METRICS.find((d) => d.id === yMetric)?.label;
  const topCondition = useMemo(() => topConcern(analyses), [analyses]);

  // Most recommended brand: from by_skin_type — use the top skinType as a proxy label
  const topBrand = useMemo(() => {
    const byBrand = {};
    for (const row of analyses) {
      const brand = row.brand || row.recommended_brand || null;
      if (brand) byBrand[brand] = (byBrand[brand] || 0) + 1;
    }
    const sorted = Object.entries(byBrand).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? "CeraVe";
  }, [analyses]);

  const statCards = [
    {
      label: "Total Users",
      value: m.total_users ?? 0,
      icon: Users,
      color: PALETTE.primary,
      bg: "rgba(107,58,82,0.08)",
    },
    {
      label: "Total Analyses",
      value: m.total_analyses ?? 0,
      icon: Activity,
      color: PALETTE.series[2],
      bg: "rgba(107,142,175,0.08)",
    },
    {
      label: "Avg Skin Score",
      value: m.avg_score ?? 0,
      icon: Star,
      color: PALETTE.series[3],
      bg: "rgba(212,168,67,0.08)",
      sub: `${m.filtered_analyses ?? 0} total scans`,
    },
    {
      label: "Products in DB",
      value: m.total_products ?? 0,
      icon: Package,
      color: PALETTE.series[1],
      bg: "rgba(122,158,135,0.08)",
    },
    {
      label: "Top Concern",
      value: topCondition,
      icon: TrendingUp,
      color: "#A67856",
      bg: "rgba(166,120,86,0.08)",
      isText: true,
    },
    {
      label: "Most Recommended",
      value: topBrand,
      icon: Award,
      color: PALETTE.accent,
      bg: "rgba(196,133,154,0.08)",
      isText: true,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Live analytics from AI analyses — pick any dimension pair to explore.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub, isText }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${bg} 0%, transparent 60%)` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <p
              className="font-display font-semibold text-foreground"
              style={{ fontSize: isText ? "1.1rem" : "1.75rem", lineHeight: 1.2 }}
            >
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Loading charts…</p>}

      {/* ── Chart explorer ── */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-medium text-foreground">Chart explorer</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{dimLabel} → {metricLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select className={inputCls} value={xDim} onChange={(e) => setXDim(e.target.value)} aria-label="X axis">
              {DIMENSIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <select className={inputCls} value={yMetric} onChange={(e) => setYMetric(e.target.value)} aria-label="Y metric">
              {METRICS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {CHART_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartType(t.id)}
                  className={`px-2.5 py-2 text-xs font-medium transition-colors ${chartType === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ExplorerChart data={explorerData} chartType={chartType} metric={yMetric} />

        {chartType === "pie" && explorerData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
            {explorerData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PALETTE.series[i % PALETTE.series.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-1">Score distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">How scans land across score bands</p>
          <MiniBar
            data={(data?.score_distribution || []).map((r) => ({ name: r.range, count: r.count }))}
            color={PALETTE.accent}
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-1">Condition share</h3>
          <p className="text-xs text-muted-foreground mb-3">Dominant skin condition across all scans</p>
          {skinShare.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={skinShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                    {skinShare.map((_, i) => <Cell key={i} fill={PALETTE.series[i % PALETTE.series.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(107,58,82,0.12)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                {skinShare.slice(0, 6).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: PALETTE.series[i % PALETTE.series.length] }} />
                    {d.name} ({d.count})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-1">By age group</h3>
          <p className="text-xs text-muted-foreground mb-3">Scan volume by user age band</p>
          <MiniBar
            data={(data?.by_age_group || []).map((r) => ({ name: r.age_group, count: r.count }))}
            color={PALETTE.series[2]}
          />
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-1">Avg condition severity</h3>
          <p className="text-xs text-muted-foreground mb-3">Mean AI % across all analyses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.condition_averages || []} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="condition" width={92} tick={{ fontSize: 10, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(107,58,82,0.12)", fontSize: 12 }} cursor={{ fill: "rgba(107,58,82,0.04)" }} />
              <Bar dataKey="avg" fill={PALETTE.series[3]} radius={[0, 3, 3, 0]} maxBarSize={16} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display text-base font-medium text-foreground mb-1">Score trend</h3>
        <p className="text-xs text-muted-foreground mb-3">Daily average skin score</p>
        {dailyTimeline.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No analyses recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyTimeline} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.primary} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={PALETTE.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={PALETTE.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: PALETTE.muted }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: PALETTE.muted }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid rgba(107,58,82,0.12)", fontSize: 12 }}
                formatter={(val, key) => [val, key === "avg_score" ? "Avg score" : "Scans"]}
              />
              <Area type="monotone" dataKey="avg_score" stroke={PALETTE.primary} strokeWidth={2} fill="url(#adminGrad)" name="Avg score" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
