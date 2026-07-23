const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { detail: text };
    }
    if (!res.ok) {
      const detail = data?.detail;
      const message = typeof detail === "string" ? detail : (detail ? JSON.stringify(detail) : "Request failed");
      return { ok: false, error: message, data };
    }
    return { ok: true, data };
  } catch (err) {
    const msg = err?.message || "";
    if (msg.includes("fetch") || msg.includes("Network") || err?.name === "TypeError") {
      return {
        ok: false,
        error: "Network Error: Could not connect to API. Please run the backend on port 8000.",
      };
    }
    return { ok: false, error: msg || "Unknown error" };
  }
}

function withAvatar(user) {
  if (!user) return user;
  return {
    ...user,
    avatar: user.name ? user.name[0].toUpperCase() : "U",
  };
}

export async function registerUser(name, email, password, role = "user", adminCode = "") {
  const result = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      skin_type: "Combination",
      age: 25,
      role,
      admin_code: adminCode,
    }),
  });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, user: withAvatar(result.data.user) };
}

export async function loginUser(email, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, user: withAvatar(result.data.user) };
}

/** Analysis is saved on the backend during /api/user/analyze */
export async function saveAnalysis() {
  return { success: true };
}

export async function getUserAnalyses(userId) {
  const result = await request(`/api/user/${userId}/progress`);
  if (!result.ok) return [];
  return (result.data || []).map((item) => ({
    date: item.date,
    score: item.overall_score,
    imagePreview: null,
  }));
}

export async function getAdminStats() {
  const result = await request("/api/admin/dashboard");
  if (!result.ok) {
    return { totalUsers: 0, analysesRun: 0, avgScore: "0.0", openFeedback: 0, recent: [] };
  }
  const m = result.data.metrics || {};
  return {
    totalUsers: m.total_users ?? 0,
    analysesRun: m.total_analyses ?? 0,
    avgScore: m.avg_score ?? "0.0",
    openFeedback: m.open_feedback ?? 0,
    recent: result.data.recent_analyses || [],
  };
}

export async function getUsers() {
  const result = await request("/api/admin/users");
  return result.ok ? result.data : [];
}

export async function getAnalyses() {
  const result = await request("/api/admin/analyses");
  return result.ok ? result.data : [];
}

export async function getConditions() {
  const result = await request("/api/admin/conditions");
  return result.ok ? result.data : [];
}

export async function getIngredients() {
  const result = await request("/api/admin/ingredients");
  return result.ok ? result.data : [];
}

export async function getProducts() {
  const result = await request("/api/admin/products");
  return result.ok ? result.data : [];
}

export async function getFeedback() {
  const result = await request("/api/admin/feedback");
  return result.ok ? result.data : [];
}

export async function createProduct(payload) {
  return request("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateProduct(id, payload) {
  return request(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteProduct(id) {
  return request(`/api/admin/products/${id}`, { method: "DELETE" });
}

export async function createIngredient(payload) {
  return request("/api/admin/ingredients", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateIngredient(id, payload) {
  return request(`/api/admin/ingredients/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteIngredient(id) {
  return request(`/api/admin/ingredients/${id}`, { method: "DELETE" });
}

export async function deleteUser(id) {
  return request(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function updateUserStatus(id, status) {
  return request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function deleteAnalysis(id) {
  return request(`/api/admin/analyses/${id}`, { method: "DELETE" });
}

export async function updateFeedbackStatus(id, status) {
  return request(`/api/admin/feedback/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function deleteFeedback(id) {
  return request(`/api/admin/feedback/${id}`, { method: "DELETE" });
}

export async function createFeedback(payload) {
  return request("/api/admin/feedback", { method: "POST", body: JSON.stringify(payload) });
}
