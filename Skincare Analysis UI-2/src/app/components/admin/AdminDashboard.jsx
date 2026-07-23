import { useState, useEffect } from "react";
import { Users, Activity, Star, MessageSquare } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "../Badge";
import { getAdminStats } from "../../../services/api";

export function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, analysesRun: 0, avgScore: "0.0", openFeedback: 0 });
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await getAdminStats();
      if (cancelled) return;
      setStats(s);
      setRecentAnalyses((s.recent || []).slice(0, 5));
    })();
    return () => { cancelled = true; };
  }, []);

  const scoreData = [
    { range: "40–55", users: 12 }, { range: "56–70", users: 87 },
    { range: "71–85", users: 76 }, { range: "86–100", users: 35 },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-foreground mb-1">Dashboard</h2>
      <p className="text-muted-foreground text-sm mb-6">Lumina system overview</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Users", value: stats.totalUsers, note: "+12 this month", icon: Users, c: "#6B3A52" },
          { label: "Analyses Run", value: stats.analysesRun, note: "+89 this week", icon: Activity, c: "#6B8EAF" },
          { label: "Avg Score", value: stats.avgScore, note: "+2.1 vs last month", icon: Star, c: "#D4A843" },
          { label: "Open Feedback", value: stats.openFeedback, note: "Needs attention", icon: MessageSquare, c: "#C4859A" },
        ].map(({ label, value, note, icon: Icon, c }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c}15` }}>
                <Icon size={14} style={{ color: c }} />
              </div>
            </div>
            <p className="font-display text-3xl font-semibold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <YAxis tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip contentStyle={{ background: "#FFF", border: "1px solid rgba(107,58,82,0.12)", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="users" fill="#C4859A" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display text-base font-medium text-foreground mb-4">Recent Analyses</h3>
          <div className="space-y-3">
            {recentAnalyses.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">{(a.user || "?").split(" ").map(n => n[0]).join("")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.user}</p>
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-sm font-semibold text-foreground">{a.score ?? a.overall_score}</p>
                  <Badge variant={(a.status || "Completed") === "Completed" ? "success" : "warning"}>{a.status || "Completed"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
