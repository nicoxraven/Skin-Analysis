import { useState } from "react";
import { X } from "lucide-react";
import { NOTIFICATIONS } from "../lib/constants";

export function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const unreadCount = notifs.filter((n) => n.unread).length;

  const markAll = () => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })));

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">Notifications</span>
          {unreadCount > 0 && <span className="bg-primary text-primary-foreground text-xs font-mono px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && <button onClick={markAll} className="text-xs text-primary hover:opacity-80 transition-opacity font-medium px-2 py-1">Mark all read</button>}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={14} /></button>
        </div>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {notifs.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer ${n.unread ? "bg-secondary/20" : ""}`}
              onClick={() => setNotifs((ns) => ns.map((x) => x.id === n.id ? { ...x, unread: false } : x))}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${n.color}15` }}>
                <Icon size={15} style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-muted-foreground/60 font-mono mt-1">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ——— Sidebar ———
