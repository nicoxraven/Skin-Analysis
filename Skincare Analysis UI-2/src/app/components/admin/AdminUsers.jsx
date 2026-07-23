import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getUsers, deleteUser } from "../../../services/api";

export function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getUsers().then((rows) => { if (!cancelled) setUsers(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "name", label: "Name", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "email", label: "Email", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
    { key: "skinType", label: "Skin Type", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "age", label: "Age", render: (v) => <span className="font-mono">{v}</span> },
    { key: "joined", label: "Joined" },
    { key: "analyses", label: "Analyses", render: (v) => <span className="font-mono">{v}</span> },
    { key: "status", label: "Status", render: (v) => <Badge variant={v === "Active" ? "success" : "outline"}>{v}</Badge> },
  ];
  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm(`Delete user ${row.name}?`)) return;
    const res = await deleteUser(row.id);
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== row.id));
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader title="Users" description="Registered accounts" count={users.length} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={users} onDelete={handleDelete} />
      </div>
    </div>
  );
}

