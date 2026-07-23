import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getConditions } from "../../../services/api";

export function AdminConditions() {
  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getConditions().then((rows) => { if (!cancelled) setConditions(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "name", label: "Condition", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "category", label: "Category", render: (v) => <Badge variant="info">{v}</Badge> },
    { key: "prevalence", label: "Prevalence", render: (v) => <span className="font-mono text-sm">{v}</span> },
    { key: "description", label: "Description", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
  ];
  return (
    <div>
      <AdminHeader title="Skin Conditions" description="Conditions the AI detects" count={conditions.length} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={conditions} />
      </div>
    </div>
  );
}

