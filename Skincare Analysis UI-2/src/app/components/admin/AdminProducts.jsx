import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Badge } from "../Badge";
import { AdminHeader } from "../AdminHeader";
import { DataTable } from "../DataTable";
import { getProducts, createProduct, deleteProduct } from "../../../services/api";

export function AdminProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getProducts().then((rows) => { if (!cancelled) setProducts(rows || []); });
    return () => { cancelled = true; };
  }, []);

  const cols = [
    { key: "name", label: "Product", render: (v) => <span className="font-semibold text-sm">{v}</span> },
    { key: "brand", label: "Brand", render: (v) => <span className="text-xs text-muted-foreground">{v}</span> },
    { key: "category", label: "Category", render: (v) => <Badge variant="outline">{v}</Badge> },
    { key: "price", label: "Price", render: (v) => <span className="font-mono font-semibold">{v}</span> },
    {
      key: "rating", label: "Rating", render: (v) => (
        <span className="flex items-center gap-1 font-mono text-sm"><Star size={11} className="text-amber-400 fill-amber-400" />{v}</span>
      )
    },
    { key: "inStock", label: "Stock", render: (v) => <Badge variant={v ? "success" : "danger"}>{v ? "In Stock" : "Out"}</Badge> },
  ];
  const handleAdd = async () => {
    const name = prompt("Product name:");
    if (!name) return;
    const brand = prompt("Brand:") || "Lumina";
    const category = prompt("Category (cleanser/serum/moisturizer/sunscreen):") || "serum";
    const target_condition = prompt("Target condition:") || "Acne";
    const res = await createProduct({ brand, name, category, target_condition, intensity: "mild" });
    if (res.ok) {
      const rows = await getProducts();
      setProducts(rows);
    } else alert(res.error || "Create failed");
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    if (!confirm(`Delete ${row.name}?`)) return;
    const res = await deleteProduct(row.id);
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== row.id));
    else alert(res.error || "Delete failed");
  };

  return (
    <div>
      <AdminHeader title="Products" description="Lumina Labs catalog" count={products.length} onAdd={handleAdd} />
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <DataTable columns={cols} data={products} onDelete={handleDelete} />
      </div>
    </div>
  );
}

