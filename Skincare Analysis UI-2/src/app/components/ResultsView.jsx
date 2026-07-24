import { useEffect, useState } from "react";
import {
  CheckCircle2, TrendingUp, ChevronRight, AlertCircle,
  Leaf, Sun, Moon, Camera, Check,
} from "lucide-react";
import { Badge } from "./Badge";
import { ScoreRing } from "./ScoreRing";
import { scoreLabel } from "../lib/helpers";
import { getTodayRoutine, toggleRoutineStep } from "../../services/api";

export function ResultsView({
  analysis,
  userId,
  onProgress,
  onWeeklyRescan,
  canRescan = false,
  daysUntilRescan = 7,
}) {
  const [tab, setTab] = useState("routine");
  const [time, setTime] = useState("am");
  const [amDone, setAmDone] = useState([]);
  const [pmDone, setPmDone] = useState([]);
  const [savingStep, setSavingStep] = useState(null);
  const { label, color } = scoreLabel(analysis?.score ?? 0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getTodayRoutine(userId).then((data) => {
      if (cancelled || !data) return;
      setAmDone(data.am_done || []);
      setPmDone(data.pm_done || []);
    });
    return () => { cancelled = true; };
  }, [userId, analysis?.analysis_id]);

  const steps = time === "am" ? (analysis?.amRoutine || []) : (analysis?.pmRoutine || []);
  const doneList = time === "am" ? amDone : pmDone;
  const doneCount = steps.filter((s) => doneList.includes(s.step)).length;

  const handleToggle = async (stepNum) => {
    const isDone = doneList.includes(stepNum);
    const nextDone = !isDone;
    // optimistic UI
    const updater = (prev) => (
      nextDone ? [...new Set([...prev, stepNum])] : prev.filter((s) => s !== stepNum)
    );
    if (time === "am") setAmDone(updater);
    else setPmDone(updater);

    setSavingStep(stepNum);
    const res = await toggleRoutineStep(userId, {
      period: time,
      step: stepNum,
      done: nextDone,
      analysisId: analysis?.analysis_id,
    });
    setSavingStep(null);
    if (!res.ok) {
      // rollback
      if (time === "am") setAmDone((prev) => (
        isDone ? [...new Set([...prev, stepNum])] : prev.filter((s) => s !== stepNum)
      ));
      else setPmDone((prev) => (
        isDone ? [...new Set([...prev, stepNum])] : prev.filter((s) => s !== stepNum)
      ));
      alert(res.error || "Could not save checklist");
    }
  };

  if (!analysis) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No analysis yet. Upload a selfie to begin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Your Skin Plan</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {analysis.created_at || "Today"} · {analysis.skinType} skin
            {!canRescan && (
              <span className="ml-2 font-mono text-xs">· next scan in {daysUntilRescan}d</span>
            )}
          </p>
        </div>
        {canRescan ? (
          <button
            type="button"
            onClick={onWeeklyRescan}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 bg-primary text-primary-foreground hover:opacity-90"
          >
            <Camera size={15} /> Weekly check-in
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={13} /> Active plan
          </span>
        )}
      </div>

      {canRescan && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          It has been a week since your last selfie. Upload a new photo to refresh your scores and routine.
        </div>
      )}

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
            You have {(analysis.concerns || []).length} addressable concerns. Check off your AM/PM routine each day — we will ask for a new selfie after 7 days.
          </p>
          <button
            type="button"
            onClick={onProgress}
            className="mt-4 flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80 transition-opacity mx-auto sm:mx-0"
          >
            <TrendingUp size={14} /> Track my progress <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {["routine", "concerns", "ingredients"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors
                ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "concerns" && (
            <div className="space-y-3">
              {(analysis.concerns || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No major concerns detected.</p>
              )}
              {(analysis.concerns || []).map((c) => {
                const Icon = c.icon || AlertCircle;
                return (
                  <div key={c.name} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/30">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${c.color || "#6B3A52"}18` }}>
                      <Icon size={17} style={{ color: c.color || "#6B3A52" }} />
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
                <div key={ing.name} className="flex items-center gap-3 p-4 rounded-xl border border-border">
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
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div className="flex bg-muted rounded-xl p-1 w-fit">
                  {["am", "pm"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                        ${time === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                    >
                      {t === "am" ? <><Sun size={12} /> Morning</> : <><Moon size={12} /> Evening</>}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Today · {doneCount}/{steps.length} done
                </p>
              </div>

              <div className="w-full bg-muted rounded-full h-1.5 mb-4">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }}
                />
              </div>

              <div className="space-y-2">
                {steps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No routine steps yet.</p>
                )}
                {steps.map((step) => {
                  const checked = doneList.includes(step.step);
                  const busy = savingStep === step.step;
                  return (
                    <button
                      key={step.step}
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggle(step.step)}
                      className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl border text-left transition-colors
                        ${checked ? "border-emerald-200 bg-emerald-50/70" : "border-border hover:bg-secondary/30"}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors
                          ${checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-card text-transparent"}`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${checked ? "text-emerald-900 line-through decoration-emerald-400/80" : "text-foreground"}`}>
                          {step.product}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.note}</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">#{step.step}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
