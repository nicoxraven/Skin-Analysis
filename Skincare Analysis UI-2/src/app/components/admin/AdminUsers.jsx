import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getUsers, deleteUser, updateUser } from "../../../services/api";

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const load = async (q = search) => {
    setUsers(await getUsers(q));
  };

  useEffect(() => { load(""); }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const cols = [
    { key: "name", label: "Name", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "email", label: "Email", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
    { key: "role", label: "Role", render: (v) => <Badge variant={v === "admin" ? "warning" : "outline"}>{v}</Badge> },
    { key: "skinType", label: "Skin", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "age", label: "Age", render: (v) => <span className="font-mono">{v ?? "—"}</span> },
    { key: "analyses", label: "Scans", render: (v) => <span className="font-mono">{v}</span> },
    { key: "joined", label: "Joined" },
    {
      key: "status",
      label: "Status",
      render: (v, row) => (
        <button
          type="button"
          disabled={row.role === "admin"}
          onClick={async () => {
            const next = v === "Active" ? "Suspended" : "Active";
            const res = await updateUser(row.id, { status: next });
            if (res.ok) load();
            else alert(res.error || "Update failed");
          }}
          title="Click to toggle status"
        >
          <Badge variant={v === "Active" ? "success" : "danger"}>{v}</Badge>
        </button>
      ),
    },
  ];

  const handleEdit = async (row) => {
    if (row.role === "admin") {
      alert("Admin accounts are managed in the database seed only.");
      return;
    }
    const name = prompt("Name:", row.name);
    if (name == null) return;
    const ageStr = prompt("Age:", String(row.age ?? ""));
    if (ageStr == null) return;
    const age = ageStr === "" ? null : Number(ageStr);
    const res = await updateUser(row.id, { name, age: Number.isFinite(age) ? age : null });
    if (res.ok) load();
    else alert(res.error || "Update failed");
  };

  const handleDelete = async (row) => {
    if (row.role === "admin") {
      alert("Cannot delete admin accounts.");
      return;
    }
    if (!confirm(`Delete user ${row.name} and all their analyses?`)) return;
    const res = await deleteUser(row.id);
    if (res.ok) load();
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader
        title="Users"
        description="CRUD on registered accounts (admin is seeded, not signed up from UI)."
        count={users.length}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, email, skin, status…"
      />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={users} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
