import { useEffect, useRef, useState } from "react";
import { X, Search, Check, Package, Loader2 } from "lucide-react";
import { getProducts } from "../../services/api";

const CATEGORIES = ["All", "cleanser", "moisturizer", "treatment", "serum", "sunscreen", "toner"];

export function ProductPickerPanel({ userId, onDone, onClose, preSelected = [] }) {
    const [query, setQuery] = useState("");
    const [catFilter, setCatFilter] = useState("All");
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(() => new Set(preSelected.map(String)));
    const panelRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        fetchProducts(query);
    }, []);

    const fetchProducts = async (q = "") => {
        setLoading(true);
        const data = await getProducts(q);
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const handleSearch = (val) => {
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchProducts(val), 320);
    };

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(String(id))) next.delete(String(id));
            else next.add(String(id));
            return next;
        });
    };

    const filtered = catFilter === "All"
        ? products
        : products.filter((p) =>
            (p.category || "").toLowerCase().includes(catFilter.toLowerCase())
        );

    const handleDone = () => {
        onDone([...selected]);
        onClose();
    };

    // close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
            <div
                ref={panelRef}
                className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
                style={{ animation: "slideUp 0.22s ease" }}
            >
                <style>{`
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                    <div>
                        <p className="font-semibold text-foreground text-sm">My Products</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Select products you own or have been recommended
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 pt-3 pb-2 flex-shrink-0">
                    <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                        <Search size={14} className="text-muted-foreground shrink-0" />
                        <input
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search products or brands…"
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                </div>

                {/* Category pills */}
                <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCatFilter(c)}
                            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full border font-medium transition-colors capitalize ${catFilter === c
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                                }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Product list */}
                <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-1.5">
                    {loading && (
                        <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                            <Loader2 size={15} className="animate-spin" />
                            Loading products…
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-10">No products found.</p>
                    )}
                    {!loading && filtered.map((p) => {
                        const id = String(p.id);
                        const isSelected = selected.has(id);
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggle(p.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border hover:bg-secondary/30"
                                    }`}
                            >
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: isSelected ? "rgba(107,58,82,0.1)" : "rgba(107,58,82,0.05)" }}
                                >
                                    <Package size={14} style={{ color: isSelected ? "#6B3A52" : "#8C7B75" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {p.name || p.product_name || "Unnamed"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {p.brand} {p.category ? `· ${p.category}` : ""}
                                    </p>
                                </div>
                                <span
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-border bg-card"
                                        }`}
                                >
                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                        {selected.size} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-xl border border-border hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDone}
                            className="px-5 py-2 text-sm rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
