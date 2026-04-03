/**
 * API Service for Almaty Smart City AI Microservice
 * Connects to the dual-brain analysis pipeline at localhost:8001
 */

const AI_SERVICE_URL = 'http://localhost:8001';
const TIMEOUT_MS = 120000; // 2 minutes for full LLM analysis

/**
 * Check if AI service is healthy
 * @returns {Promise<{status: string}>}
 */
export async function checkHealth() {
  const response = await fetchWithTimeout(`${AI_SERVICE_URL}/health`, {
    method: 'GET',
  });
  return response.json();
}

/**
 * Check if Ollama LLM (Brain 2) is available
 * @returns {Promise<{ollama_available: boolean, model: string|null}>}
 */
export async function checkOllamaHealth() {
  try {
    const response = await fetchWithTimeout(`${AI_SERVICE_URL}/analyze/health/ollama`, {
      method: 'GET',
    });
    return response.json();
  } catch {
    return { ollama_available: false, model: null };
  }
}

/**
 * Run full Brain 1 + Brain 2 unified analysis
 * @param {Object} options
 * @param {number} [options.topN=3] - Number of top segments/zones to analyze in detail
 * @param {string} [options.context] - Optional context for analysis
 * @returns {Promise<UnifiedAnalysisResponse>}
 */
export async function runUnifiedAnalysis({ topN = 3, context = '' } = {}) {
  const response = await fetchWithTimeout(`${AI_SERVICE_URL}/analyze/unified`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      top_n: topN,
      context: context,
      include_full_brain1: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Analysis failed: ${error}`);
  }
  
  return response.json();
}

/**
 * Run Brain 1 only analysis (no LLM, works without Ollama)
 * @param {Object} options
 * @param {number} [options.topN=3] - Number of top segments/zones to analyze
 * @returns {Promise<UnifiedAnalysisResponse>}
 */
export async function runBrain1OnlyAnalysis({ topN = 3 } = {}) {
  const response = await fetchWithTimeout(`${AI_SERVICE_URL}/analyze/unified/brain1-only`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/**
 * Run analysis with automatic fallback to Brain 1 only if Ollama unavailable
 * @param {Object} options
 * @param {number} [options.topN=3] - Number of top segments/zones
 * @param {string} [options.context] - Optional context
 * @returns {Promise<{data: UnifiedAnalysisResponse, mode: 'full' | 'brain1_only'}>}
 */
export async function runAnalysisWithFallback({ topN = 3, context = '' } = {}) {
  // First check if Ollama is available
  const ollamaStatus = await checkOllamaHealth();
  
  if (ollamaStatus.ollama_available) {
    try {
      const data = await runUnifiedAnalysis({ topN, context });
      return { data, mode: 'full' };
    } catch (error) {
      console.warn('Full analysis failed, falling back to Brain 1:', error);
      const data = await runBrain1OnlyAnalysis({ topN });
      return { data, mode: 'brain1_only' };
    }
  } else {
    console.info('Ollama not available, using Brain 1 only');
    const data = await runBrain1OnlyAnalysis({ topN });
    return { data, mode: 'brain1_only' };
  }
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Legacy: Run roads-only analysis
 * @returns {Promise<Object>}
 */
export async function analyzeRoads() {
  const response = await fetchWithTimeout(`${AI_SERVICE_URL}/analyze/roads/brain1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return response.json();
}

/**
 * Legacy: Run cameras-only analysis
 * @returns {Promise<Object>}
 */
export async function analyzeCameras() {
  const response = await fetchWithTimeout(`${AI_SERVICE_URL}/analyze/cameras/brain1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return response.json();
}
