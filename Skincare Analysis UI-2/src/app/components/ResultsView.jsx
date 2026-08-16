import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, TrendingUp, ChevronRight, AlertCircle,
  Leaf, Sun, Moon, Camera, Check, CalendarDays,
  AlertTriangle, FlaskConical, Droplets, Sparkles,
  ShieldCheck, ShoppingBag, PackageCheck,
} from "lucide-react";
import { Badge } from "./Badge";
import { ScoreRing } from "./ScoreRing";
import { scoreLabel } from "../lib/helpers";
import { getTodayRoutine, toggleRoutineStep, requestPremium } from "../../services/api";
import { ProductPickerPanel } from "./ProductPickerPanel";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUserProducts(userId) {
  try {
    return JSON.parse(localStorage.getItem(`user_products_${userId}`) || "[]");
  } catch {
    return [];
  }
}

function saveUserProducts(userId, ids) {
  localStorage.setItem(`user_products_${userId}`, JSON.stringify(ids));
}

function hasSeenProductQuestion(userId) {
  return localStorage.getItem(`products_question_seen_${userId}`) === "1";
}

function markProductQuestionSeen(userId) {
  localStorage.setItem(`products_question_seen_${userId}`, "1");
}

// Map routine step names / notes to a Lucide icon and a category label
function resolveStepMeta(step) {
  const text = `${step.product || ""} ${step.note || ""}`.toLowerCase();
  if (/cleanser|clean|wash|foam/.test(text))
    return { Icon: Droplets, label: "Cleanser", color: "#6B8EAF" };
  if (/toner|essence|mist/.test(text))
    return { Icon: Droplets, label: "Toner / Essence", color: "#7A9E87" };
  if (/serum|treatment|retinol|bha|aha|vitamin c|niacinamide|acid/.test(text))
    return { Icon: Sparkles, label: "Treatment / Serum", color: "#A67856" };
  if (/moisturizer|moisturising|cream|lotion|gel|snail|barrier/.test(text))
    return { Icon: ShieldCheck, label: "Moisturizer", color: "#7A9E87" };
  if (/sunscreen|spf|sun/.test(text))
    return { Icon: Sun, label: "Sunscreen", color: "#D4A843" };
  if (/sleeping mask|night mask|mask/.test(text))
    return { Icon: Moon, label: "Night Mask", color: "#6B3A52" };
  return { Icon: Leaf, label: "Skincare", color: "#8C7B75" };
}

// ── Main component ───────────────────────────────────────────────────────────

export function ResultsView({
  analysis,
  userId,
  onProgress,
  onWeeklyRescan,
  onForceRescan,
  canRescan = false,
  daysUntilRescan = 7,
  isForceRescan = false,
  tier = "premium",
}) {
  const [tab, setTab] = useState(tier === "free" ? "concerns" : "routine");
  const [time, setTime] = useState("am");
  const [amDone, setAmDone] = useState([]);
  const [pmDone, setPmDone] = useState([]);
  const [savingStep, setSavingStep] = useState(null);
  const [upgrading, setUpgrading] = useState(false);

  // "My Products" question state
  const [showProductQ, setShowProductQ] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [myProducts, setMyProducts] = useState([]);

  const { label, color } = scoreLabel(analysis?.score ?? 0);

  // Load today's routine toggle state
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

  // Show product question once per user
  useEffect(() => {
    if (!userId) return;
    setShowProductQ(!hasSeenProductQuestion(userId));
    setMyProducts(getUserProducts(userId));
  }, [userId]);

  const steps = time === "am" ? (analysis?.amRoutine || []) : (analysis?.pmRoutine || []);
  const doneList = time === "am" ? amDone : pmDone;
  const doneCount = steps.filter((s) => doneList.includes(s.step)).length;

  const handleToggle = async (stepNum) => {
    const isDone = doneList.includes(stepNum);
    const nextDone = !isDone;
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
      if (time === "am") setAmDone((prev) => (isDone ? [...new Set([...prev, stepNum])] : prev.filter((s) => s !== stepNum)));
      else setPmDone((prev) => (isDone ? [...new Set([...prev, stepNum])] : prev.filter((s) => s !== stepNum)));
      alert(res.error || "Could not save checklist");
    }
  };

  const handleProductsDone = useCallback((selectedIds) => {
    saveUserProducts(userId, selectedIds);
    markProductQuestionSeen(userId);
    setMyProducts(selectedIds.map(String));
    setShowProductQ(false);
  }, [userId]);

  const handleSkipProductQ = () => {
    markProductQuestionSeen(userId);
    setShowProductQ(false);
  };

  if (!analysis) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">No analysis yet. Upload a selfie to begin.</p>
      </div>
    );
  }

  // Tab definitions with Lucide icons
  const TABS = tier === "free"
    ? [
      { id: "concerns", label: "Concerns", Icon: AlertTriangle },
      { id: "ingredients", label: "Ingredients", Icon: FlaskConical },
    ]
    : [
      { id: "routine", label: "Routine", Icon: CalendarDays },
      { id: "concerns", label: "Concerns", Icon: AlertTriangle },
      { id: "ingredients", label: "Ingredients", Icon: FlaskConical },
    ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
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
        <div className="flex flex-col gap-2 items-end flex-shrink-0">
          {canRescan ? (
            <button
              type="button"
              onClick={isForceRescan ? onForceRescan : onWeeklyRescan}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90"
            >
              <Camera size={15} /> {isForceRescan ? "Rescan now" : "Weekly check-in"}
            </button>
          ) : (
            <>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 size={13} /> Active plan
              </span>
              {tier === "premium" && (
                <button
                  type="button"
                  onClick={onForceRescan}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10"
                >
                  <Camera size={12} /> Request new scan
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {canRescan && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {isForceRescan
            ? "A rescan has been requested. Upload a new selfie to refresh your scores, routine, and restart the 7-day timer."
            : "It has been a week since your last selfie. Upload a new photo to refresh your scores and routine."}
        </div>
      )}

      {tier === "free" && (
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-foreground">Free Tier</span>
            <span className="text-xs text-muted-foreground">Unlock daily routines with Premium.</span>
          </div>
          <button
            disabled={upgrading}
            onClick={async () => {
              setUpgrading(true);
              try {
                const res = await requestPremium(userId);
                if (res.ok) alert("Premium request sent! An admin will review your upgrade shortly.");
                else alert(res.error || "Could not send premium request.");
              } finally {
                setUpgrading(false);
              }
            }}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {upgrading ? "Requesting…" : "Upgrade Now"}
          </button>
        </div>
      )}

      {/* Score card */}
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

      {/* ── "My products" question banner ── */}
      {showProductQ && tier !== "free" && (
        <div className="mb-4 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-0.5">Do you currently use any products?</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Tell us what you already own or have been recommended — we'll highlight them in your routine.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <PackageCheck size={14} /> Yes, pick my products
                </button>
                <button
                  type="button"
                  onClick={handleSkipProductQ}
                  className="text-sm px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  No, show my routine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick "manage products" button always available after question is dismissed */}
      {!showProductQ && tier !== "free" && (
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="mb-4 flex items-center gap-2 text-xs font-medium text-primary hover:opacity-80 transition-opacity bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 w-fit"
        >
          <PackageCheck size={13} />
          {myProducts.length > 0
            ? `${myProducts.length} product${myProducts.length > 1 ? "s" : ""} selected · manage`
            : "Update My Products"}
        </button>
      )}

      {/* ── Tab panel ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {TABS.map(({ id, label: tLabel, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${tab === id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon size={13} />
              {tLabel}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Concerns tab ── */}
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

          {/* ── Ingredients tab ── */}
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

          {/* ── Routine tab ── */}
          {tab === "routine" && (
            <div>
              {/* AM / PM toggle */}
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div className="flex bg-muted rounded-xl p-1 w-fit">
                  {[
                    { id: "am", Icon: Sun, label: "Morning" },
                    { id: "pm", Icon: Moon, label: "Evening" },
                  ].map(({ id, Icon, label: tLabel }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTime(id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${time === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        }`}
                    >
                      <Icon size={12} /> {tLabel}
                    </button>
                  ))}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  {doneCount}/{steps.length} done today
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1 mb-5">
                <div
                  className="h-1 rounded-full transition-all duration-500"
                  style={{
                    width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%`,
                    background: "linear-gradient(90deg, #6B3A52, #C4859A)",
                  }}
                />
              </div>

              {/* Step cards */}
              <div className="space-y-2.5">
                {steps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No routine steps yet.</p>
                )}
                {steps.map((step) => {
                  const checked = doneList.includes(step.step);
                  const busy = savingStep === step.step;
                  const { Icon, label: catLabel, color: iconColor } = resolveStepMeta(step);
                  // Check if user already owns a matching product
                  const owned = myProducts.length > 0 &&
                    (step.productId ? myProducts.includes(String(step.productId)) : false);

                  return (
                    <button
                      key={step.step}
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggle(step.step)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 ${checked
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-border hover:bg-secondary/20 hover:border-border/80"
                        }`}
                      style={{
                        borderLeft: `3px solid ${checked ? "#10b981" : iconColor}`,
                      }}
                    >
                      {/* Category icon */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: checked
                            ? "rgba(16,185,129,0.1)"
                            : `${iconColor}18`,
                        }}
                      >
                        <Icon
                          size={15}
                          style={{ color: checked ? "#10b981" : iconColor }}
                        />
                      </div>

                      {/* Step info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${checked ? "text-emerald-900 line-through decoration-emerald-400/60" : "text-foreground"}`}>
                            {step.product}
                          </p>
                          {owned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              <Check size={9} strokeWidth={3} /> You own this
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{catLabel} · {step.note}</p>
                      </div>

                      {/* Checkbox */}
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${checked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-border bg-card"
                          }`}
                      >
                        {checked && <Check size={11} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Picker modal */}
      {showPicker && tier !== "free" && (
        <ProductPickerPanel
          userId={userId}
          preSelected={myProducts}
          onDone={handleProductsDone}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
