import { useState, useEffect } from "react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../../services/api";
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from "../../lib/constants";

const emptyForm = {
  brand: "",
  name: "",
  category: "cleanser",
  target_condition: "Acne",
  intensity: "mild",
};

export function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async (q = search) => setRows(await getProducts(q));

  useEffect(() => { load(""); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const cols = [
    { key: "name", label: "Product", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "brand", label: "Brand", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
    { key: "category", label: "Category", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "target_condition", label: "For condition", render: (v) => <Badge variant="info">{v}</Badge> },
    { key: "intensity", label: "Intensity", render: (v) => <Badge variant={v === "harsh" ? "warning" : "success"}>{v}</Badge> },
  ];

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      brand: row.brand,
      name: row.name,
      category: row.category,
      target_condition: row.target_condition,
      intensity: row.intensity || "mild",
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) {
      alert("Brand and name are required");
      return;
    }
    const res = editingId
      ? await updateProduct(editingId, form)
      : await createProduct(form);
    if (!res.ok) {
      alert(res.error || "Save failed");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (row) => {
    if (!confirm(`Delete ${row.name}? This removes it from the AI recommendation catalog.`)) return;
    const res = await deleteProduct(row.id);
    if (res.ok) load();
    else alert(res.error || "Delete failed");
  };

  const field = (key, label, el) => (
    <div key={key}>
      <label className="text-xs font-medium text-foreground block mb-1">{label}</label>
      {el}
    </div>
  );

  const inputCls = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div>
      <AdminHeader
        title="Products"
        description="Recommendation catalog used by the AI routine builder (cleanser / treatment / moisturizer / sunscreen)."
        count={rows.length}
        onAdd={openCreate}
        addLabel="Add product"
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search brand, name, category, condition…"
      />

      {showForm && (
        <form onSubmit={handleSave} className="mb-5 bg-card border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <p className="sm:col-span-2 text-sm font-semibold text-foreground">
            {editingId ? `Edit product #${editingId}` : "New product for AI recommendations"}
          </p>
          {field("brand", "Brand", (
            <input className={inputCls} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
          ))}
          {field("name", "Name", (
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          ))}
          {field("category", "Category", (
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ))}
          {field("target_condition", "Target condition", (
            <select className={inputCls} value={form.target_condition} onChange={(e) => setForm({ ...form, target_condition: e.target.value })}>
              {PRODUCT_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          ))}
          {field("intensity", "Intensity", (
            <select className={inputCls} value={form.intensity} onChange={(e) => setForm({ ...form, intensity: e.target.value })}>
              <option value="mild">mild</option>
              <option value="harsh">harsh</option>
            </select>
          ))}
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted">Cancel</button>
            <button type="submit" className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90">
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={rows} onEdit={openEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
