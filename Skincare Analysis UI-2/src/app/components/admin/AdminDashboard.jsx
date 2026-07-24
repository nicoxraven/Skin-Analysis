import { useEffect, useState } from "react";
import { Users, Activity, Package, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { Badge } from "../Badge";
import { getAdminDashboard } from "../../../services/api";

const inputCls = "bg-card border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary";

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [skinType, setSkinType] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const d = await getAdminDashboard({
      skin_type: skinType || undefined,
      age_min: ageMin === "" ? undefined : Number(ageMin),
      age_max: ageMax === "" ? undefined : Number(ageMax),
    });
    setData(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const m = data?.metrics || {};
  const analyses = data?.analyses || [];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Dashboard</h2>
      <p className="text-muted-foreground text-sm mb-5">
        Live database analytics from AI analyses. Filter by skin type or age.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-card border border-border rounded-2xl">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Skin type contains</label>
          <input className={inputCls} value={skinType} onChange={(e) => setSkinType(e.target.value)} placeholder="e.g. Acne" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Age min</label>
          <input className={`${inputCls} w-24`} type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="18" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Age max</label>
          <input className={`${inputCls} w-24`} type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="45" />
        </div>
        <button type="button" onClick={load} className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90">
          Apply filters
        </button>
        <button
          type="button"
          onClick={async () => {
            setSkinType("");
            setAgeMin("");
            setAgeMax("");
            setLoading(true);
            const d = await getAdminDashboard({});
            setData(d);
            setLoading(false);
          }}
          className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-muted"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Users", value: m.total_users ?? 0, icon: Users, c: "#6B3A52" },
          { label: "All Analyses", value: m.total_analyses ?? 0, icon: Activity, c: "#6B8EAF" },
          { label: "Filtered Avg Score", value: m.avg_score ?? 0, icon: Star, c: "#D4A843" },
          { label: "Products (AI catalog)", value: m.total_products ?? 0, icon: Package, c: "#7A9E87" },
        ].map(({ label, value, icon: Icon, c }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c}15` }}>
                <Icon size={14} style={{ color: c }} />
              </div>
            </div>
            <p className="font-display text-3xl font-semibold text-foreground">{value}</p>
            {label.startsWith("Filtered") && (
              <p className="text-xs text-muted-foreground mt-0.5">{m.filtered_analyses ?? 0} matching scans</p>
            )}
          </div>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Loading charts…</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">Score distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.score_distribution || []} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#C4859A" radius={[4, 4, 0, 0]} name="Analyses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">By dominant skin condition</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.by_skin_type || []} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="skinType" tick={{ fontSize: 10, fill: "#8C7B75" }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6B3A52" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">By age group</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.by_age_group || []} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="age_group" tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6B8EAF" radius={[4, 4, 0, 0]} name="Scans" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">Avg AI condition severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.condition_averages || []} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="condition" tick={{ fontSize: 10, fill: "#8C7B75" }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#D4A843" radius={[4, 4, 0, 0]} name="Avg %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <h3 className="font-display text-base font-medium text-foreground mb-4">All filtered analyses (timeline)</h3>
        {(data?.timeline || []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No analyses match these filters yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.timeline || []} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B3A52" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6B3A52" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8C7B75" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="#6B3A52" fill="url(#adminGrad)" name="Score" />
              <Line type="monotone" dataKey="score" stroke="#6B3A52" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-base font-medium text-foreground">Analysis records</h3>
          <span className="font-mono text-xs text-muted-foreground">{analyses.length} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                {["User", "Age", "Skin", "Score", "Date"].map((h) => (
                  <th key={h} className="text-left py-3 px-4 font-mono text-xs text-muted-foreground tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-medium">{a.user}</td>
                  <td className="py-3 px-4 font-mono">{a.age ?? "—"}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{a.skinType}</Badge></td>
                  <td className="py-3 px-4 font-mono font-semibold">{a.score}</td>
                  <td className="py-3 px-4 text-muted-foreground">{a.datetime || a.date}</td>
                </tr>
              ))}
              {analyses.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No rows</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
