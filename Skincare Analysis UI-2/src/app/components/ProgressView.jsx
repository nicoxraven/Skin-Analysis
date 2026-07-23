import {
  ArrowLeft, TrendingUp, Calendar,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export function ProgressView({ historyData, onBack }) {
  const current = historyData.length ? historyData[historyData.length - 1].score : 50;
  const first = historyData.length ? historyData[0].score : 50;
  const gain = current - first;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={15} /> Back to results
      </button>

      <h1 className="font-display text-3xl font-semibold text-foreground mb-1">My Progress</h1>
      <p className="text-muted-foreground text-sm mb-6">Skin scores over time</p>

      {/* Highlight */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 mb-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={26} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-primary-foreground/70 text-sm">Total improvement</p>
          <p className="font-display text-4xl font-semibold">+{gain >= 0 ? gain : 0} pts</p>
          <p className="text-sm text-primary-foreground/70 mt-0.5">From {first} → {current} over active tracking</p>
        </div>
      </div>

      {/* Chart */}
      {historyData.length > 0 && (
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
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#8C7B75" }} />
              <Tooltip contentStyle={{ background: "#FFF", border: "1px solid rgba(107,58,82,0.12)", borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#6B3A52" strokeWidth={2.5} fill="url(#grad)" dot={{ fill: "#6B3A52", r: 4 }} name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        {historyData.slice().reverse().map((d, i) => (
          <div key={i} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
              {d.imagePreview ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                  <img src={d.imagePreview} alt="Selfie thumbnail" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Calendar size={14} className="text-primary" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground">{d.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 bg-muted rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${d.score}%` }} />
              </div>
              <span className="font-mono text-sm font-semibold text-foreground w-6 text-right">{d.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——— Admin Views ———
