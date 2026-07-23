import { useState } from "react";
import {
  Save, CheckCircle2, TrendingUp, ChevronRight, AlertCircle,
  Leaf, Sun, Moon,
} from "lucide-react";
import { Badge } from "./Badge";
import { ScoreRing } from "./ScoreRing";
import { scoreLabel } from "../lib/helpers";

export function ResultsView({ analysis, onSave, onProgress }) {
  const [tab, setTab] = useState("concerns");
  const [time, setTime] = useState("am");
  const [saved, setSaved] = useState(false);
  const { label, color } = scoreLabel(analysis.score);

  const handleSave = async () => {
    const success = await onSave(analysis);
    if (success) setSaved(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Your Analysis</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Today · {analysis.skinType} skin</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all
            ${saved ? "bg-emerald-500 text-white cursor-default" : "bg-primary text-primary-foreground hover:opacity-90"}`}
        >
          {saved ? <><CheckCircle2 size={15} /> Saved</> : <><Save size={15} /> Save to History</>}
        </button>
      </div>

      {/* Score and Selfie Row */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <ScoreRing score={analysis.score} />
          {analysis.imagePreview && (
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border shadow-sm">
              <img src={analysis.imagePreview} alt="Selfie preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-muted-foreground text-sm mb-1">Overall skin health</p>
          <p className={`font-display text-2xl font-semibold mb-3 ${color}`}>{label}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have {(analysis.concerns || []).length} addressable concerns. With the right routine, you can expect visible improvement in 4–8 weeks.
          </p>
          <button onClick={onProgress} className="mt-4 flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity mx-auto sm:mx-0">
            <TrendingUp size={14} /> Track my progress <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {["concerns", "ingredients", "routine"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors
                ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "concerns" && (
            <div className="space-y-3">
              {(analysis.concerns || []).map((c) => {
                const Icon = c.icon || AlertCircle;
                return (
                  <div key={c.name} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${c.color || '#6B3A52'}18` }}>
                      <Icon size={17} style={{ color: c.color || '#6B3A52' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{c.name}</span>
                        <Badge variant={c.severity === "Moderate" ? "warning" : c.severity === "Mild" ? "info" : "success"}>{c.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.tip}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "ingredients" && (
            <div className="space-y-3">
              {(analysis.ingredients || []).map((ing) => (
                <div key={ing.name} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Leaf size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground">{ing.name}</span>
                      {ing.essential && <Badge variant="default">Essential</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{ing.benefit}</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono flex-shrink-0 text-right">{ing.when}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "routine" && (
            <div>
              <div className="flex bg-muted rounded-xl p-1 mb-5 w-fit mx-auto">
                {["am", "pm"].map((t) => (
                  <button key={t} onClick={() => setTime(t)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                      ${time === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    {t === "am" ? <><Sun size={12} /> Morning</> : <><Moon size={12} /> Evening</>}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                {(time === "am" ? (analysis.amRoutine || []) : (analysis.pmRoutine || [])).map((step) => (
                  <div key={step.step} className="flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-secondary/30 transition-colors">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0">{step.step}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{step.product}</p>
                      <p className="text-xs text-muted-foreground">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ——— User: Progress ———
