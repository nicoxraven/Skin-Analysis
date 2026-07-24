import {
  Sparkles, LayoutDashboard, Users, Activity, Package,
  Home, TrendingUp, Camera,
} from "lucide-react";

export const RESCAN_DAYS = 7;
export const DEFAULT_ANALYSIS = null;

export const USER_NAV = [
  { id: "home", label: "My Skin", icon: Home },
  { id: "progress", label: "My Progress", icon: TrendingUp },
];

/** Slim admin for school project: analytics + core CRUD tied to AI */
export const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "analyses", label: "Analyses", icon: Activity },
  { id: "products", label: "Products", icon: Package },
];

export const NOTIF_META = {
  analysis: { color: "#6B3A52", icon: Sparkles },
  routine: { color: "#D4A843", icon: Sparkles },
  progress: { color: "#7A9E87", icon: TrendingUp },
  reminder: { color: "#6B8EAF", icon: Camera },
  info: { color: "#6B3A52", icon: Sparkles },
};

export const PRODUCT_CATEGORIES = [
  "cleanser",
  "day_treatment",
  "night_treatment",
  "moisturizer",
  "sunscreen",
];

export const PRODUCT_CONDITIONS = [
  "Acne",
  "Dryness",
  "Oily Skin",
  "Dark Spots",
  "Wrinkles",
  "All",
];
