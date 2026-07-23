import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertCircle } from "lucide-react";
import { analyzeSelfie } from "../../services/ai";

export function AnalyzingView({ onDone, imageFile, userId, onCancel }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Scanning skin texture…");
  const [errorMsg, setErrorMsg] = useState(null);
  const onDoneRef = useRef(onDone);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onDoneRef.current = onDone;
    onCancelRef.current = onCancel;
  }, [onDone, onCancel]);

  useEffect(() => {
    if (!imageFile) {
      setErrorMsg("No image selected. Please go back and choose a photo.");
      return;
    }

    let cancelled = false;
    let progressValue = 0;
    let apiDone = false;
    let apiResult = null;
    let apiError = null;

    const steps = [
      "Scanning skin texture…",
      "Detecting concerns…",
      "Matching ingredients…",
      "Building your routine…",
      "Almost done…",
    ];

    setProgress(0);
    setErrorMsg(null);
    setStatusText(steps[0]);

    const finishIfReady = () => {
      if (cancelled) return;
      if (apiError) {
        setErrorMsg(apiError);
        return;
      }
      if (apiDone && apiResult && progressValue >= 100) {
        onDoneRef.current(apiResult);
      }
    };

    analyzeSelfie(imageFile, userId)
      .then((result) => {
        if (cancelled) return;
        apiResult = result;
        apiDone = true;
        setStatusText("Analysis complete!");
        setProgress(100);
        progressValue = 100;
        finishIfReady();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("AI Analysis failed:", err);
        apiError = err?.message || "Failed to analyze image. Please ensure your face is clearly visible.";
        setErrorMsg(apiError);
      });

    const timer = setInterval(() => {
      if (cancelled || apiError) {
        clearInterval(timer);
        return;
      }
      // Crawl toward 92% while waiting for AI; jump to 100% when API returns
      if (apiDone) {
        progressValue = 100;
        setProgress(100);
        clearInterval(timer);
        finishIfReady();
        return;
      }
      if (progressValue < 92) {
        progressValue = Math.min(92, progressValue + 2);
        setProgress(progressValue);
        const idx = Math.min(Math.floor(progressValue / 23), steps.length - 1);
        setStatusText(steps[idx]);
      } else {
        setStatusText("Waiting for AI model…");
      }
    }, 80);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [imageFile, userId]);

  if (errorMsg) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Analysis Failed</h2>
        <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
        <button
          type="button"
          onClick={() => onCancelRef.current?.()}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
        >
          Try Another Photo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <div className="relative w-28 h-28 mx-auto mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="48" fill="none" stroke="#EDE3DE" strokeWidth="7" />
          <circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="#6B3A52"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 48}`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
            className="transition-all duration-100"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={28} className="text-primary animate-pulse" />
        </div>
      </div>
      <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Analyzing…</h2>
      <p className="text-sm text-muted-foreground mb-6 h-5">{statusText}</p>
      <div className="w-full bg-muted rounded-full h-1.5 mb-2">
        <div className="bg-primary h-1.5 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground font-mono">{progress}%</p>
      <p className="text-xs text-muted-foreground mt-4">First analysis can take 30–60s while the AI model loads.</p>
    </div>
  );
}
