import { useEffect, useState } from "react";
import { X, Sparkles, Bell } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/api";
import { NOTIF_META } from "../lib/constants";

export function NotifPanel({ userId, onClose, onUnreadChange }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifs.filter((n) => n.unread).length;

  const load = async () => {
    setLoading(true);
    const rows = await getNotifications(userId);
    setNotifs(rows);
    setLoading(false);
    onUnreadChange?.(rows.filter((n) => n.unread).length);
  };

  useEffect(() => {
    if (userId) load();
  }, [userId]);

  const markAll = async () => {
    await markAllNotificationsRead(userId);
    setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })));
    onUnreadChange?.(0);
  };

  const markOne = async (id) => {
    await markNotificationRead(userId, id);
    setNotifs((ns) => {
      const next = ns.map((x) => (x.id === id ? { ...x, unread: false } : x));
      onUnreadChange?.(next.filter((n) => n.unread).length);
      return next;
    });
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-mono px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button type="button" onClick={markAll} className="text-xs text-primary hover:opacity-80 transition-opacity font-medium px-2 py-1">
              Mark all read
            </button>
          )}
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-border max-h-80 overflow-y-auto">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && notifs.length === 0 && (
          <div className="px-4 py-10 text-center">
            <Bell size={20} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
        {!loading && notifs.map((n) => {
          const meta = NOTIF_META[n.type] || NOTIF_META.info;
          const Icon = meta.icon || Sparkles;
          const color = n.color || meta.color;
          return (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer ${n.unread ? "bg-secondary/20" : ""}`}
              onClick={() => markOne(n.id)}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}15` }}>
                <Icon size={15} style={{ color }} />
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
