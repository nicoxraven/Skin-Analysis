import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getFeedback, deleteFeedback, updateFeedbackStatus } from "../../../services/api";

export function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getFeedback().then((rows) => { if (!cancelled) setFeedback(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "user", label: "User", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "date", label: "Date" },
    {
      key: "rating", label: "Rating", render: (v) => (
        <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} className={s <= v ? "text-amber-400 fill-amber-400" : "text-muted"} />)}</div>
      )
    },
    { key: "category", label: "Category", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "comment", label: "Comment", render: (v) => <span className="text-xs text-muted-foreground max-w-xs truncate block">{v}</span> },
    { key: "resolved", label: "Status", render: (v) => <Badge variant={v ? "success" : "warning"}>{v ? "Resolved" : "Open"}</Badge> },
  ];
  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm("Delete this feedback?")) return;
    const res = await deleteFeedback(row.id);
    if (res.ok) setFeedback((prev) => prev.filter((f) => f.id !== row.id));
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader title="Feedback" description="User reviews and reports" count={feedback.length} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={feedback} onDelete={handleDelete} />
      </div>
    </div>
  );
}


// ——— Notification Panel ———
