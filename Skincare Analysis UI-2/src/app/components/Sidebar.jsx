import { useState } from "react";
import {
  Sparkles, Shield, UserCircle, X, LogOut,
} from "lucide-react";
import { USER_NAV, ADMIN_NAV } from "../lib/constants";
import { requestPremium } from "../../services/api";

export function Sidebar({
  user, onLogout, userSection, setUserSection, adminSection, setAdminSection, open, onClose,
}) {
  const [requesting, setRequesting] = useState(false);

  const handleRequestPremium = async () => {
    setRequesting(true);
    try {
      const res = await requestPremium(user.id);
      if (res.ok) alert("Premium request sent to Admin!");
      else alert(res.error || "Failed to request premium");
    } finally {
      setRequesting(false);
    }
  };

  const role = (user.role || "user").toLowerCase();
  const nav = role === "user" ? USER_NAV : ADMIN_NAV;
  const setSection = (id) => {
    if (role === "user") setUserSection(id);
    else setAdminSection(id);
    onClose();
  };

  const isActive = (id) => {
    if ((user.role || "").toLowerCase() === "user") {
      if (id === "home") {
        return ["home", "upload", "analyzing", "results"].includes(userSection);
      }
      return userSection === id;
    }
    return adminSection === id;
  };

  return (
    <>
      {/* Overlay on mobile */}
      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border flex flex-col z-40 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles size={15} className="text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-semibold text-foreground">Lumina</span>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground mt-0.5 ml-10 tracking-widest uppercase">
              {role === "admin" ? "Admin Console" : "Skin Intelligence"}
            </p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3">
          <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${role === "admin" ? "bg-primary/8" : "bg-secondary"}`}>
            {role === "admin" ? <Shield size={14} className="text-primary" /> : <UserCircle size={14} className="text-primary" />}
            <span className="text-xs font-medium text-foreground capitalize">
              {role === "admin" ? "Admin View" : `${user.tier || "Premium"} Tier`}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          {nav.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive(id) ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {role === "user" && user.tier === "free" && !user.premiumRequested && (
          <div className="px-4 py-3 border-t border-border mt-auto">
            <button
              onClick={handleRequestPremium}
              disabled={requesting}
              className="w-full py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {requesting ? "Requesting..." : "Request Premium"}
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
              Unlock weekly scans and continuous progress tracking.
            </p>
          </div>
        )}

        {/* User footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-foreground">{user.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button onClick={onLogout} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ——— App ———
