import {
  Sparkles, Clock, TrendingUp, Leaf, Award, Camera, LayoutDashboard,
  Users, Activity, AlertCircle, FlaskConical, Package, MessageSquare,
} from "lucide-react";

export const NOTIFICATIONS = [
  { id: 1, icon: Sparkles, color: "#6B3A52", title: "Analysis ready", body: "Your latest skin analysis has been processed.", time: "2 min ago", unread: true },
  { id: 2, icon: Clock, color: "#D4A843", title: "Evening routine reminder", body: "Time for your PM routine — don't skip treatment night.", time: "1 hr ago", unread: true },
  { id: 3, icon: TrendingUp, color: "#7A9E87", title: "Score improved!", body: "Your skin score went up this week. Great progress.", time: "Yesterday", unread: true },
  { id: 4, icon: Leaf, color: "#6B8EAF", title: "New recommendation", body: "Ceramides added to your evening routine based on new data.", time: "2 days ago", unread: false },
  { id: 5, icon: Award, color: "#C4859A", title: "30-day streak", body: "You've logged your routine every day for a month. Amazing!", time: "3 days ago", unread: false },
];

export const DEFAULT_ANALYSIS = {
  score: 74,
  scoreLabel: "Good",
  skinType: "Combination",
  concerns: [
    { name: "Dehydration", severity: "Moderate", tip: "Drink more water and use a hydrating serum daily." },
    { name: "Uneven Tone", severity: "Mild", tip: "Vitamin C serum in the morning can help even things out." },
    { name: "Enlarged Pores", severity: "Moderate", tip: "Niacinamide will visibly minimize pores within 4–6 weeks." },
    { name: "Fine Lines", severity: "Early", tip: "Start retinol 2–3× per week at a low concentration." },
  ],
  ingredients: [
    { name: "Hyaluronic Acid", benefit: "Replenishes lost moisture deeply", when: "AM + PM", essential: true },
    { name: "Niacinamide 10%", benefit: "Minimizes pores, evens skin tone", when: "AM + PM", essential: true },
    { name: "Vitamin C 15%", benefit: "Brightens and protects from UV damage", when: "Morning only", essential: false },
    { name: "Retinol 0.025%", benefit: "Smooths texture and softens lines", when: "3× per week PM", essential: false },
    { name: "SPF 50", benefit: "Prevents pigmentation and aging", when: "Every morning", essential: true },
  ],
  amRoutine: [
    { step: 1, product: "Gentle Foam Cleanser", note: "60 sec, lukewarm water" },
    { step: 2, product: "Vitamin C Serum", note: "Let absorb 2 min before next step" },
    { step: 3, product: "Hyaluronic Acid Serum", note: "Apply on slightly damp skin" },
    { step: 4, product: "Lightweight Moisturizer", note: "Face and neck" },
    { step: 5, product: "SPF 50 Sunscreen", note: "Last step, 2 finger-lengths" },
  ],
  pmRoutine: [
    { step: 1, product: "Cleansing Oil", note: "Remove makeup and SPF" },
    { step: 2, product: "Gentle Foam Cleanser", note: "Second cleanse" },
    { step: 3, product: "Niacinamide Toner", note: "Pat in gently" },
    { step: 4, product: "Retinol Serum (3× weekly)", note: "Skip on rest nights" },
    { step: 5, product: "Hyaluronic Acid Serum", note: "Apply on damp skin" },
    { step: 6, product: "Rich Night Moisturizer", note: "Generous layer" },
  ],
  imagePreview: null,
};

export const USER_NAV = [
  { id: "upload", label: "New Analysis", icon: Camera },
  { id: "progress", label: "My Progress", icon: TrendingUp },
];

export const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "analyses", label: "Skin Analyses", icon: Activity },
  { id: "conditions", label: "Skin Conditions", icon: AlertCircle },
  { id: "ingredients", label: "Ingredients", icon: FlaskConical },
  { id: "products", label: "Products", icon: Package },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
];
