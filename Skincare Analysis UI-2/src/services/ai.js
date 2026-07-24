const API_BASE = "http://localhost:8000";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function mapToRoutine(backendRoutine) {
  const mapped = [];
  let step = 1;
  if (!backendRoutine) return mapped;

  if (backendRoutine.step_1_cleanser) {
    mapped.push({ step: step++, product: backendRoutine.step_1_cleanser.name, note: "Cleanser" });
  }
  if (backendRoutine.step_2_treatment) {
    mapped.push({ step: step++, product: backendRoutine.step_2_treatment.name, note: "Treatment" });
  }
  if (backendRoutine.step_3_moisturizer) {
    mapped.push({ step: step++, product: backendRoutine.step_3_moisturizer.name, note: "Moisturize" });
  }
  if (backendRoutine.step_4_sunscreen) {
    mapped.push({ step: step++, product: backendRoutine.step_4_sunscreen.name, note: "Sun Protection" });
  }
  return mapped;
}

/**
 * Sends selfie to FastAPI AI endpoint and maps response for the UI.
 * YES — this file is required. It is the AI bridge (frontend → backend model).
 */
export async function analyzeSelfie(imageFile, userId = 1) {
  let base64Preview = null;
  try {
    base64Preview = await fileToDataUrl(imageFile);
  } catch (e) {
    console.warn("Could not read image as data URL:", e);
  }

  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("user_id", String(userId));

  const response = await fetch(`${API_BASE}/api/user/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "Analysis Failed";
    try {
      const errObj = await response.json();
      message = errObj.detail || message;
    } catch {
      /* ignore */
    }
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  const data = await response.json();

  if (data.ui) {
    return { ...data.ui, imagePreview: base64Preview };
  }

  const scores = data.scores || {};
  const concerns = [];

  for (const [key, val] of Object.entries(scores)) {
    if (val > 25.0) {
      let severity = val > 65 ? "Moderate" : "Mild";
      if (val > 85) severity = "Severe";
      concerns.push({ name: key, severity, tip: "Addressed via your personalized routine." });
    }
  }

  let dominantCondition = "Normal";
  let highest = -1;
  for (const [key, val] of Object.entries(scores)) {
    if (val > highest) {
      highest = val;
      dominantCondition = key;
    }
  }

  const rec = data.recommendation || {};

  return {
    analysis_id: data.analysis_id,
    score: data.overall_score,
    skinType: dominantCondition,
    concerns,
    ingredients: [
      { name: "Specific Actives", benefit: "Tailored by AI to your condition", when: "As directed", essential: true },
      { name: "Moisturizer", benefit: "Barrier repair", when: "AM + PM", essential: true },
      { name: "SPF", benefit: "Daily UV protection", when: "Morning", essential: true },
    ],
    amRoutine: mapToRoutine(rec.day_routine),
    pmRoutine: mapToRoutine(rec.night_routine),
    imagePreview: base64Preview,
    can_rescan: false,
    days_until_rescan: 7,
  };
}
