export function scoreLabel(s) {
  if (s >= 90) return { label: "Excellent", color: "text-emerald-600" };
  if (s >= 76) return { label: "Great", color: "text-emerald-500" };
  if (s >= 61) return { label: "Good", color: "text-amber-500" };
  if (s >= 41) return { label: "Fair", color: "text-orange-500" };
  return { label: "Needs Care", color: "text-red-500" };
}
