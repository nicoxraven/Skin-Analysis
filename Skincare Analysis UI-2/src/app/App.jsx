import { useState, useEffect, useRef } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { getUserAnalyses, saveAnalysis } from "../services/api";
import { DEFAULT_ANALYSIS, NOTIFICATIONS } from "./lib/constants";
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
import { AdminConditions } from "./components/admin/AdminConditions";
import { AdminIngredients } from "./components/admin/AdminIngredients";
import { AdminProducts } from "./components/admin/AdminProducts";
import { AdminFeedback } from "./components/admin/AdminFeedback";

export default function App() {
  const [user, setUser] = useState(null);
  const [userSection, setUserSection] = useState("upload");
  const [adminSection, setAdminSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  const [uploadingFile, setUploadingFile] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(DEFAULT_ANALYSIS);
  const [userHistory, setUserHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    getUserAnalyses(user.id).then(setUserHistory);
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleStartAnalysis = (file) => {
    setUploadingFile(file);
    setUserSection("analyzing");
  };

  const handleAnalysisCompleted = async (result) => {
    setCurrentAnalysis(result);
    setUserSection("results");
    if (user?.id) {
      const history = await getUserAnalyses(user.id);
      setUserHistory(history);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!user) return false;
    const res = await saveAnalysis();
    if (res.success) {
      const updatedHistory = await getUserAnalyses(user.id);
      setUserHistory(updatedHistory);
      return true;
    }
    return false;
  };

  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;

  const role = (user.role || "user").toLowerCase();

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
        onLogout={() => setUser(null)}
        userSection={userSection}
        setUserSection={setUserSection}
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

          {/* <div className="flex-1 flex items-center gap-2 max-w-xs">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 w-full">
              <Search size={13} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search…"
                className="text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
              />
            </div>
          </div> */}

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
              {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
            </div>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-default">
              <span className="text-xs font-semibold text-primary-foreground">{user.avatar}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {role === "user" && (
            <>
              {userSection === "upload" && <UploadView onAnalyze={handleStartAnalysis} />}
              {userSection === "analyzing" && (
                <AnalyzingView
                  imageFile={uploadingFile}
                  userId={user.id}
                  onDone={handleAnalysisCompleted}
                  onCancel={() => setUserSection("upload")}
                />
              )}
              {userSection === "results" && (
                <ResultsView
                  analysis={currentAnalysis}
                  onSave={handleSaveAnalysis}
                  onProgress={() => setUserSection("progress")}
                />
              )}
              {userSection === "progress" && (
                <ProgressView historyData={userHistory} onBack={() => setUserSection("results")} />
              )}
            </>
          )}
          {role === "admin" && (
            <div className="p-5 sm:p-6">
              {adminSection === "dashboard" && <AdminDashboard />}
              {adminSection === "users" && <AdminUsers />}
              {adminSection === "analyses" && <AdminAnalyses />}
              {adminSection === "conditions" && <AdminConditions />}
              {adminSection === "ingredients" && <AdminIngredients />}
              {adminSection === "products" && <AdminProducts />}
              {adminSection === "feedback" && <AdminFeedback />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
