import { Plus, Search } from "lucide-react";

export function AdminHeader({ title, description, count, onAdd, addLabel = "Add New", search, onSearch, searchPlaceholder = "Search…" }) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {count !== undefined && (
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{count} records</span>
          )}
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              <Plus size={12} /> {addLabel}
            </button>
          )}
        </div>
      </div>
      {onSearch && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 max-w-md">
          <Search size={14} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={search || ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
          />
        </div>
      )}
    </div>
  );
}
