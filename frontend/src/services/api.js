const BACKEND_API_URL = "http://localhost:8000/api";
const TIMEOUT_MS = 120000;

export async function checkHealth() {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/health`, {
    method: "GET",
  });
  return response.json();
}

export async function checkOllamaHealth() {
  try {
    const response = await fetchWithTimeout(`${BACKEND_API_URL}/analysis/health/ollama`, {
      method: "GET",
    });
    const data = await response.json();
    return {
      ...data,
      ollama_available:
        data?.ollama_available ??
        data?.model_available ??
        Boolean(data?.available ?? data?.model),
    };
  } catch {
    return { ollama_available: false, model: null, model_available: false };
  }
}

export async function getCityOverview() {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/city/overview`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`City overview failed: ${error}`);
  }

  return response.json();
}

export async function runUnifiedAnalysis({ topN = 3, context = "" } = {}) {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/analysis/unified`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      top_n: topN,
      context,
      include_full_brain1: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analysis failed: ${error}`);
  }

  return response.json();
}

export async function runBrain1OnlyAnalysis({ topN = 3 } = {}) {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/analysis/unified/brain1-only`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      top_n: topN,
      include_full_brain1: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Brain 1 analysis failed: ${error}`);
  }

  return response.json();
}

export async function createRecommendation(segmentId, scenario = "combined", language = "ru") {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/segments/${segmentId}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, language }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Recommendation failed: ${error}`);
  }

  return response.json();
}

export async function createForecast(actionId, notes = "") {
  const response = await fetchWithTimeout(`${BACKEND_API_URL}/recommendations/${actionId}/forecast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: notes || null }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Forecast failed: ${error}`);
  }

  return response.json();
}

export async function runAnalysisWithFallback({ topN = 3, context = "" } = {}) {
  try {
    const data = await runUnifiedAnalysis({ topN, context });
    return { data, mode: "full" };
  } catch (error) {
    console.warn("Full analysis failed, falling back to Brain 1:", error);
    const data = await runBrain1OnlyAnalysis({ topN });
    return { data, mode: "brain1_only" };
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
