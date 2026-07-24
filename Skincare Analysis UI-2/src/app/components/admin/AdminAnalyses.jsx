import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getAnalyses, deleteAnalysis } from "../../../services/api";

export function AdminAnalyses() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const load = async (q = search) => setRows(await getAnalyses(q));

  useEffect(() => { load(""); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const cols = [
    { key: "user", label: "User", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "age", label: "Age", render: (v) => <span className="font-mono">{v ?? "—"}</span> },
    { key: "date", label: "Date" },
    {
      key: "score",
      label: "Score",
      render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-14 bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, v || 0)}%` }} />
          </div>
          <span className="font-mono text-xs font-semibold">{v}</span>
        </div>
      ),
    },
    { key: "skinType", label: "Dominant", render: (v) => <Badge variant="outline">{v}</Badge> },
    {
      key: "concern_list",
      label: "Concerns",
      render: (v) => <span className="text-xs text-muted-foreground">{(v || []).join(", ") || "None"}</span>,
    },
  ];

  const handleDelete = async (row) => {
    if (!confirm(`Delete analysis #${row.id} for ${row.user}?`)) return;
    const res = await deleteAnalysis(row.id);
    if (res.ok) load();
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader
        title="AI Analyses"
        description="Every skin scan saved in the database from the AI model."
        count={rows.length}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search user, skin type, date…"
      />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={rows} onDelete={handleDelete} />
      </div>
    </div>
  );
}
