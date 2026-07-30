const API_BASE = `http://${window.location.hostname}:8000`;

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
  if (!result.ok) return { history: [], summary: null };
  const data = result.data || {};
  // Support both old array shape and new object shape
  if (Array.isArray(data)) {
    return {
      history: data.map((item) => ({
        date: item.date,
        score: item.overall_score ?? item.score,
        imagePreview: null,
        skinType: item.skinType,
      })),
      summary: null,
    };
  }
  return {
    history: (data.history || []).map((item) => ({
      id: item.id,
      date: item.date,
      score: item.score ?? item.overall_score,
      imagePreview: null,
      skinType: item.skinType,
      scores: item.scores,
    })),
    summary: data.summary || null,
  };
}

export async function getLatestAnalysis(userId) {
  const result = await request(`/api/user/${userId}/latest`);
  if (!result.ok) {
    return { has_analysis: false, needs_first_scan: true, can_rescan: true, analysis: null };
  }
  return result.data;
}

export async function getTodayRoutine(userId) {
  const result = await request(`/api/user/${userId}/routine/today`);
  if (!result.ok) return null;
  return result.data;
}

export async function toggleRoutineStep(userId, { period, step, done, analysisId, date }) {
  return request(`/api/user/${userId}/routine/toggle`, {
    method: "POST",
    body: JSON.stringify({
      period,
      step,
      done,
      analysis_id: analysisId || null,
      date: date || null,
    }),
  });
}

export async function getNotifications(userId) {
  const result = await request(`/api/user/${userId}/notifications`);
  return result.ok ? (result.data || []) : [];
}

export async function markNotificationRead(userId, notificationId) {
  return request(`/api/user/${userId}/notifications/${notificationId}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(userId) {
  return request(`/api/user/${userId}/notifications/read-all`, { method: "PATCH" });
}

export async function getAdminDashboard(filters = {}) {
  const params = new URLSearchParams();
  if (filters.skin_type) params.set("skin_type", filters.skin_type);
  if (filters.age_min != null && filters.age_min !== "") params.set("age_min", String(filters.age_min));
  if (filters.age_max != null && filters.age_max !== "") params.set("age_max", String(filters.age_max));
  const qs = params.toString();
  const result = await request(`/api/admin/dashboard${qs ? `?${qs}` : ""}`);
  if (!result.ok) {
    return {
      metrics: { total_users: 0, total_analyses: 0, filtered_analyses: 0, avg_score: 0, total_products: 0 },
      score_distribution: [],
      by_skin_type: [],
      by_age_group: [],
      condition_averages: [],
      timeline: [],
      analyses: [],
    };
  }
  return result.data;
}

/** @deprecated use getAdminDashboard */
export async function getAdminStats(filters) {
  const data = await getAdminDashboard(filters);
  return {
    totalUsers: data.metrics?.total_users ?? 0,
    analysesRun: data.metrics?.total_analyses ?? 0,
    avgScore: data.metrics?.avg_score ?? 0,
    recent: data.analyses || [],
    ...data,
  };
}

export async function getUsers(q = "") {
  const result = await request(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return result.ok ? result.data : [];
}

export async function getAnalyses(q = "") {
  const result = await request(`/api/admin/analyses${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return result.ok ? result.data : [];
}

export async function getProducts(q = "") {
  const result = await request(`/api/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
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

export async function deleteUser(id) {
  return request(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function updateUser(id, payload) {
  return request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function updateUserStatus(id, status) {
  return updateUser(id, { status });
}

export async function forceRescan(id) {
  return request(`/api/admin/users/${id}/force_rescan`, { method: "POST" });
}

export async function userForceRescan(userId) {
  return request(`/api/user/${userId}/force_rescan`, { method: "POST" });
}

export async function deleteAnalysis(id) {
  return request(`/api/admin/analyses/${id}`, { method: "DELETE" });
}
