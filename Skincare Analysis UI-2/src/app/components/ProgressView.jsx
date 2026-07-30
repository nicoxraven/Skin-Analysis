import { TrendingUp, Calendar, CheckCircle2, Flame, Camera } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export function ProgressView({ historyData = [], summary, onBack, onRescan, onForceRescan }) {
  const current = summary?.current_score ?? (historyData.length ? historyData[historyData.length - 1].score : 0);
  const first = summary?.first_score ?? (historyData.length ? historyData[0].score : 0);
  const gain = summary?.gain ?? (current - first);
  const adherence = summary?.routine_adherence_7d ?? 0;
  const streak = summary?.streak_days ?? 0;
  const daysUntil = summary?.days_until_rescan ?? 7;
  const canRescan = summary?.can_rescan ?? false;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        ← Back to my skin
      </button>

      <h1 className="font-display text-3xl font-semibold text-foreground mb-1">My Progress</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Real scores from your analyses · {summary?.skin_type || "Pending Scan"}
      </p>

      <div className="bg-primary text-primary-foreground rounded-2xl p-6 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={26} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-primary-foreground/70 text-sm">Score change since first scan</p>
          <p className="font-display text-4xl font-semibold">{gain >= 0 ? "+" : ""}{gain} pts</p>
          <p className="text-sm text-primary-foreground/70 mt-0.5">
            {historyData.length ? `${first} → ${current} across ${summary?.scan_count ?? historyData.length} scan(s)` : "No scans yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Flame size={14} className="mx-auto text-primary mb-1" />
          <p className="font-display text-xl font-semibold text-foreground">{streak}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Day streak</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <CheckCircle2 size={14} className="mx-auto text-primary mb-1" />
          <p className="font-display text-xl font-semibold text-foreground">{adherence}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">7d routine</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-3 text-center">
          <Camera size={14} className="mx-auto text-primary mb-1" />
          <p className="font-display text-xl font-semibold text-foreground">{canRescan ? "Due" : daysUntil}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{canRescan ? "Rescan" : "Days left"}</p>
        </div>
      </div>

      {canRescan ? (
        <button
          type="button"
          onClick={onRescan}
          className="w-full mb-3 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          Start weekly selfie check-in
        </button>
      ) : (
        <button
          type="button"
          onClick={onForceRescan}
          className="w-full mb-3 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
        >
          <Camera size={15} /> Request new scan
        </button>
      )}

      {historyData.length > 0 ? (
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-display text-base font-medium text-foreground mb-4">Skin Score Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={historyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6B3A52" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6B3A52" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE3DE" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip contentStyle={{ background: "#FFF", border: "1px solid rgba(107,58,82,0.12)", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#6B3A52" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: "#6B3A52", r: 4 }} name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 mb-4 text-center text-sm text-muted-foreground">
          No analysis history yet. Complete your first selfie scan to see progress here.
        </div>
      )}

      <div className="space-y-2">
        {historyData.slice().reverse().map((d, i) => (
          <div key={d.id || i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Calendar size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{d.date}</p>
                {d.skinType && <p className="text-xs text-muted-foreground">{d.skinType}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, d.score || 0)}%` }} />
              </div>
              <span className="font-mono text-sm font-semibold text-foreground w-8 text-right">{d.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
