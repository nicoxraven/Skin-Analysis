import { Filter, Plus } from "lucide-react";

export function AdminHeader({ title, description, count, onAdd }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{count} records</span>
        )}
        <button type="button" className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
          <Filter size={12} /> Filter
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={12} /> Add New
        </button>
      </div>
    </div>
  );
}
