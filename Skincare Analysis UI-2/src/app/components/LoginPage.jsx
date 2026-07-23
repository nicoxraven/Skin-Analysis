import { useState } from "react";
import {
  Sparkles, Check, Shield, UserPlus, Mail, Lock, EyeOff,
  Eye as EyeIcon, AlertTriangle, UserCircle,
} from "lucide-react";
import { loginUser, registerUser } from "../../services/api";

export function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminReg, setIsAdminReg] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isRegister) {
      const role = isAdminReg ? "admin" : "user";
      registerUser(name, email, password, role, adminCode).then((res) => {
        if (res.success) {
          onLogin(res.user);
        } else {
          setError(res.error);
        }
        setLoading(false);
      });
    } else {
      loginUser(email, password).then((res) => {
        if (res.success) {
          onLogin(res.user);
        } else {
          setError(res.error);
        }
        setLoading(false);
      });
    }
  };

  const fillDemo = (role) => {
    if (role === "user") {
      setEmail("demo@example.com");
      setPassword("password123");
    } else {
      setEmail("admin@lumina.com");
      setPassword("admin123");
    }
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
            <Sparkles size={18} className="text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold text-primary-foreground">Lumina</span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-semibold text-primary-foreground leading-tight mb-6">
            Your skin,<br /><em className="opacity-80">finally understood.</em>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Upload a selfie. Get a full skin analysis, personalized ingredient picks, and a routine built just for you.
          </p>
          <div className="mt-10 space-y-3">
            {["AI-powered analysis in under 3 seconds", "Personalized ingredient recommendations", "Track your skin journey over time"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-primary-foreground/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-primary-foreground" />
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-foreground/40 text-xs font-mono">© 2024 Lumina Skin Intelligence</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles size={15} className="text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">Lumina</span>
          </div>

          <h2 className="font-display text-3xl font-semibold text-foreground mb-1">
            {isRegister ? "Create an account" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {isRegister ? "Sign up to start tracking your skin journey." : "Sign in to your account to continue."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" id="adminReg" checked={isAdminReg} onChange={(e) => setIsAdminReg(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                <label htmlFor="adminReg" className="text-sm font-medium text-muted-foreground">Register as Admin</label>
              </div>
            )}

            {(isRegister && isAdminReg) && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Admin Secret Code</label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Hint: admin123" required={isAdminReg}
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
                <div className="relative">
                  <UserPlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe" required={isRegister}
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com" required
                  className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-9 pr-10 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> {isRegister ? "Creating account…" : "Signing in…"}</>
              ) : (
                isRegister ? "Create Account" : "Sign In"
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setError(""); }}
                className="text-primary hover:underline font-semibold"
              >
                {isRegister ? "Sign in instead" : "Sign up"}
              </button>
            </p>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Try a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => fillDemo("user")} className="text-xs border border-border rounded-xl py-2.5 px-3 hover:bg-secondary transition-colors font-medium text-foreground flex items-center gap-1.5 justify-center">
                <UserCircle size={13} /> User Demo
              </button>
              <button onClick={() => fillDemo("admin")} className="text-xs border border-border rounded-xl py-2.5 px-3 hover:bg-secondary transition-colors font-medium text-foreground flex items-center gap-1.5 justify-center">
                <Shield size={13} /> Admin Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——— User: Upload ———
