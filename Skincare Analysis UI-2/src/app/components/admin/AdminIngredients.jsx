import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getIngredients, createIngredient, deleteIngredient } from "../../../services/api";

export function AdminIngredients() {
  const [ingredients, setIngredients] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getIngredients().then((rows) => { if (!cancelled) setIngredients(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "name", label: "Ingredient", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "category", label: "Category", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "evidence", label: "Evidence", render: (v) => <Badge variant={v === "Very High" ? "success" : "info"}>{v}</Badge> },
    { key: "suitableFor", label: "Suitable For", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
  ];
  const handleAdd = async () => {
    const name = prompt("Ingredient name:");
    if (!name) return;
    const purpose = prompt("Purpose:") || "General";
    const suitable_for = prompt("Suitable for:") || "All";
    const res = await createIngredient({ name, purpose, suitable_for });
    if (res.ok) {
      const rows = await getIngredients();
      setIngredients(rows);
    } else alert(res.error || "Create failed");
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm(`Delete ${row.name}?`)) return;
    const res = await deleteIngredient(row.id);
    if (res.ok) setIngredients((prev) => prev.filter((i) => i.id !== row.id));
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader title="Ingredients" description="Active ingredients database" count={ingredients.length} onAdd={handleAdd} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={ingredients} onDelete={handleDelete} />
      </div>
    </div>
  );
}

