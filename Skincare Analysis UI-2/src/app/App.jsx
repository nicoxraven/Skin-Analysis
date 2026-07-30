import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Menu } from "lucide-react";
import {
  getUserAnalyses,
  getLatestAnalysis,
  getNotifications,
  userForceRescan,
} from "../services/api";
import { LoginPage } from "./components/LoginPage";
import { UploadView } from "./components/UploadView";
import { AnalyzingView } from "./components/AnalyzingView";
import { ResultsView } from "./components/ResultsView";
import { ProgressView } from "./components/ProgressView";
import { Sidebar } from "./components/Sidebar";
import { NotifPanel } from "./components/NotifPanel";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminUsers } from "./components/admin/AdminUsers";
import { AdminAnalyses } from "./components/admin/AdminAnalyses";
import { AdminProducts } from "./components/admin/AdminProducts";

export default function App() {
  // Restore session from localStorage so refresh doesn't log out
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("lumina_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userSection, setUserSection] = useState("home");
  const [adminSection, setAdminSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("first"); // first | weekly
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [canRescan, setCanRescan] = useState(true);
  const [isForceRescan, setIsForceRescan] = useState(false);
  const [daysUntilRescan, setDaysUntilRescan] = useState(7);
  const [userHistory, setUserHistory] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  const refreshNotifications = useCallback(async (userId) => {
    const rows = await getNotifications(userId);
    setUnreadCount(rows.filter((n) => n.unread).length);
  }, []);

  const refreshProgress = useCallback(async (userId) => {
    const data = await getUserAnalyses(userId);
    setUserHistory(data.history || []);
    setProgressSummary(data.summary || null);
  }, []);

  const refreshLatest = useCallback(async (userId) => {
    const latest = await getLatestAnalysis(userId);
    if (latest?.has_analysis && latest.analysis) {
      setCurrentAnalysis(latest.analysis);
      setCanRescan(!!latest.can_rescan);
      setIsForceRescan(!!latest.force_rescan);
      setDaysUntilRescan(latest.days_until_rescan ?? 0);
      return latest;
    }
    setCurrentAnalysis(null);
    setCanRescan(true);
    setIsForceRescan(false);
    setDaysUntilRescan(0);
    return latest;
  }, []);

  // Load real user data after login
  useEffect(() => {
    if (!user || (user.role || "user").toLowerCase() !== "user") return;
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      const latest = await refreshLatest(user.id);
      await refreshProgress(user.id);
      await refreshNotifications(user.id);
      if (cancelled) return;
      if (!latest?.has_analysis) {
        setUploadMode("first");
        setUserSection("upload");
      } else if (latest.can_rescan) {
        setUploadMode("weekly");
        setUserSection("home");
      } else {
        setUserSection("home");
      }
      setBootstrapping(false);
    })();
    return () => { cancelled = true; };
  }, [user, refreshLatest, refreshProgress, refreshNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    try { localStorage.setItem("lumina_user", JSON.stringify(u)); } catch { /* ignore */ }
  };

  const handleLogout = () => {
    setUser(null);
    try { localStorage.removeItem("lumina_user"); } catch { /* ignore */ }
  };

  // Sidebar "My Skin" / home routing
  const handleSetUserSection = async (id) => {
    if (id === "home") {
      if (!currentAnalysis) {
        setUploadMode("first");
        setUserSection("upload");
      } else {
        setUserSection("home");
      }
      return;
    }
    // Refresh progress live whenever the user navigates to that tab
    if (id === "progress" && user?.id) {
      await refreshProgress(user.id);
    }
    setUserSection(id);
  };

  const handleStartAnalysis = (file) => {
    setUploadingFile(file);
    setUserSection("analyzing");
  };

  const handleAnalysisCompleted = async (result) => {
    setCurrentAnalysis(result);
    setCanRescan(false);
    setDaysUntilRescan(result.days_until_rescan ?? 7);
    setUserSection("home");
    if (user?.id) {
      await refreshProgress(user.id);
      await refreshNotifications(user.id);
      await refreshLatest(user.id);
    }
  };

  const handleWeeklyRescan = () => {
    setUploadMode("weekly");
    setUserSection("upload");
  };

  const handleForceRescan = async () => {
    if (user?.id) {
      await userForceRescan(user.id);
      await refreshNotifications(user.id);
    }
    setUploadMode("force");
    setUserSection("upload");
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const role = (user.role || "user").toLowerCase();

  const renderUserMain = () => {
    if (bootstrapping) {
      return (
        <div className="max-w-sm mx-auto px-4 py-24 text-center text-sm text-muted-foreground">
          Loading your skin plan…
        </div>
      );
    }

    if (userSection === "upload") {
      return <UploadView onAnalyze={handleStartAnalysis} mode={uploadMode} />;
    }
    if (userSection === "analyzing") {
      return (
        <AnalyzingView
          imageFile={uploadingFile}
          userId={user.id}
          onDone={handleAnalysisCompleted}
          onCancel={() => setUserSection(currentAnalysis ? "home" : "upload")}
        />
      );
    }
    if (userSection === "progress") {
      return (
        <ProgressView
          historyData={userHistory}
          summary={progressSummary}
          onBack={() => setUserSection(currentAnalysis ? "home" : "upload")}
          onRescan={handleWeeklyRescan}
          onForceRescan={handleForceRescan}
        />
      );
    }
    // home / results
    if (currentAnalysis) {
      return (
        <ResultsView
          analysis={currentAnalysis}
          userId={user.id}
          canRescan={canRescan}
          isForceRescan={isForceRescan}
          daysUntilRescan={daysUntilRescan}
          onProgress={() => setUserSection("progress")}
          onWeeklyRescan={handleWeeklyRescan}
          onForceRescan={handleForceRescan}
        />
      );
    }
    return <UploadView onAnalyze={handleStartAnalysis} mode="first" />;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono-data { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(107,58,82,0.15); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(107,58,82,0.3); }
      `}</style>

      <Sidebar
        user={user}
        onLogout={handleLogout}
        userSection={userSection === "results" ? "home" : userSection}
        setUserSection={handleSetUserSection}
        adminSection={adminSection}
        setAdminSection={setAdminSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <Menu size={18} />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-mono font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && role === "user" && (
                <NotifPanel
                  userId={user.id}
                  onClose={() => setNotifOpen(false)}
                  onUnreadChange={setUnreadCount}
                />
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-default">
              <span className="text-xs font-semibold text-primary-foreground">{user.avatar}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {role === "user" && renderUserMain()}
          {role === "admin" && (
            <div className="p-5 sm:p-6">
              {adminSection === "dashboard" && <AdminDashboard />}
              {adminSection === "users" && <AdminUsers />}
              {adminSection === "analyses" && <AdminAnalyses />}
              {adminSection === "products" && <AdminProducts />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
