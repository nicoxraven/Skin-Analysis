import { Eye, Edit, Trash2 } from "lucide-react";

export function DataTable({ columns, data, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className="text-left py-3 px-4 font-mono text-xs text-muted-foreground tracking-widest uppercase whitespace-nowrap">
                {col.label}
              </th>
            ))}
            <th className="py-3 px-4 text-right font-mono text-xs text-muted-foreground tracking-widest uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id ?? i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
              {columns.map((col) => (
                <td key={col.key} className="py-3.5 px-4">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
              ))}
              <td className="py-3.5 px-4">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye size={13} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit size={13} /></button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(row)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-10">No records yet.</p>
      )}
    </div>
  );
}
