import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getAnalyses, deleteAnalysis } from "../../../services/api";

export function AdminAnalyses() {
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAnalyses().then((rows) => { if (!cancelled) setAnalyses(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "user", label: "User", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "date", label: "Date", render: (v) => <span className="text-sm">{v}</span> },
    {
      key: "score", label: "Score", render: (v) => (
        <div className="flex items-center gap-2">
          <div className="w-14 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${v}%` }} /></div>
          <span className="font-mono text-xs font-semibold">{v}</span>
        </div>
      )
    },
    { key: "skinType", label: "Skin Type", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "concerns", label: "Concerns", render: (v) => <span className="font-mono">{v} found</span> },
    { key: "status", label: "Status", render: (v) => <Badge variant={v === "Completed" ? "success" : "warning"}>{v}</Badge> },
  ];
  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm("Delete this analysis?")) return;
    const res = await deleteAnalysis(row.id);
    if (res.ok) setAnalyses((prev) => prev.filter((a) => a.id !== row.id));
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader title="Skin Analyses" description="All AI-powered assessments" count={analyses.length} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={analyses} onDelete={handleDelete} />
      </div>
    </div>
  );
}

