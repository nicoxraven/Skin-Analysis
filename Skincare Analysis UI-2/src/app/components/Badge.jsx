export function Badge({ children, variant = "default" }) {
  const s = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-600",
    info: "bg-blue-100 text-blue-700",
    outline: "bg-transparent border border-border text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s[variant]}`}>
      {children}
    </span>
  );
}
