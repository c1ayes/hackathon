import { useState, useEffect } from "react";
import ExecutiveSummary from "./components/ExecutiveSummary";
import MapView from "./components/MapView";
import DetailPanel from "./components/DetailPanel";
import RoadsPriorityPanel from "./components/RoadsPriorityPanel";
import CamerasPriorityPanel from "./components/CamerasPriorityPanel";
import InsightsPanel from "./components/InsightsPanel";
import { runAnalysisWithFallback, checkHealth } from "./services/api";

export default function App() {
  // Analysis state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null); // 'full' | 'brain1_only'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Selection state
  const [selectedType, setSelectedType] = useState(null); // 'road' | 'camera'
  const [selectedId, setSelectedId] = useState(null);
  
  // Service health
  const [serviceOnline, setServiceOnline] = useState(null);

  // Check service health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setServiceOnline(true))
      .catch(() => setServiceOnline(false));
  }, []);

  // Run analysis
  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setSelectedType(null);
    
    try {
      const { data, mode } = await runAnalysisWithFallback({ topN: 5 });
      setAnalysisResult(data);
      setAnalysisMode(mode);
    } catch (err) {
      setError(err.message || "Ошибка анализа. Проверьте AI сервис.");
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // Selection handlers
  function handleSelectRoad(segmentId) {
    setSelectedType("road");
    setSelectedId(segmentId);
  }

  function handleSelectCamera(intersectionId) {
    setSelectedType("camera");
    setSelectedId(intersectionId);
  }

  function handleCloseDetail() {
    setSelectedType(null);
    setSelectedId(null);
  }

  // Get selected entity data
  const selectedData = selectedId ? getSelectedData() : null;
  const selectedEnrichment = selectedId ? getSelectedEnrichment() : null;

  function getSelectedData() {
    if (!analysisResult) return null;
    if (selectedType === "road") {
      return analysisResult.brain1_roads?.segments?.find(
        (s) => s.segment_id === selectedId
      );
    }
    if (selectedType === "camera") {
      return analysisResult.brain1_cameras?.intersections?.find(
        (c) => c.intersection_id === selectedId
      );
    }
    return null;
  }

  function getSelectedEnrichment() {
    if (!analysisResult?.brain2?.enrichment) return null;
    if (selectedType === "road") {
      return analysisResult.brain2.enrichment.roads?.find(
        (e) => e.segment_id === selectedId
      );
    }
    if (selectedType === "camera") {
      return analysisResult.brain2.enrichment.cameras?.find(
        (e) => e.intersection_id === selectedId
      );
    }
    return null;
  }

  // Extract data for components
  const roads = analysisResult?.brain1_roads?.segments || [];
  const cameras = analysisResult?.brain1_cameras?.intersections || [];
  const overlaps = analysisResult?.brain2?.overlaps || [];

  return (
    <div className="flex h-full bg-gray-100 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="text-sm font-semibold text-gray-900 leading-tight">
            🏙️ Smart City
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Панель управления инфраструктурой
          </div>
          <div className="text-xs text-gray-400 mt-1">Алматы, 2025</div>
        </div>

        {/* Service Status */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                serviceOnline === null
                  ? "bg-gray-300"
                  : serviceOnline
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-gray-600">
              AI Сервис:{" "}
              {serviceOnline === null
                ? "проверка..."
                : serviceOnline
                ? "онлайн"
                : "офлайн"}
            </span>
          </div>
          {analysisMode && (
            <div className="text-xs text-gray-400 mt-1">
              Режим: {analysisMode === "full" ? "Полный (Brain 1+2)" : "Brain 1"}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="p-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !serviceOnline}
            className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all
              ${
                loading
                  ? "bg-gray-200 text-gray-500 cursor-wait"
                  : serviceOnline === false
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm"
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Анализ...
              </span>
            ) : (
              "🔍 Запустить анализ"
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Roads Panel */}
        <div className="flex-1 min-h-0 overflow-hidden border-t border-gray-100">
          <RoadsPriorityPanel
            roads={roads}
            selectedId={selectedType === "road" ? selectedId : null}
            onSelect={handleSelectRoad}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Executive Summary */}
        {analysisResult && (
          <ExecutiveSummary data={analysisResult} />
        )}

        {/* Map and Detail Panel */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Map */}
          <div className="flex-1 min-w-0 relative">
            {!analysisResult && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🗺️</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Панель управления инфраструктурой Алматы
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Нажмите "Запустить анализ" для получения данных о дорогах и камерах
                  </p>
                  {serviceOnline === false && (
                    <p className="text-red-500 text-sm">
                      ⚠️ AI сервис недоступен. Запустите: uvicorn main:app --port 8001
                    </p>
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
                <div className="text-center p-8">
                  <div className="text-5xl mb-4 animate-pulse">🧠</div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Анализ инфраструктуры...
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Brain 1: Расчёт приоритетов
                    <br />
                    Brain 2: LLM обогащение
                  </p>
                </div>
              </div>
            )}

            {analysisResult && (
              <MapView
                roads={roads}
                cameras={cameras}
                overlaps={overlaps}
                selectedId={selectedId}
                onSelectRoad={handleSelectRoad}
                onSelectCamera={handleSelectCamera}
              />
            )}
          </div>

          {/* Detail Panel (conditional) */}
          {selectedData && (
            <DetailPanel
              type={selectedType}
              data={selectedData}
              enrichment={selectedEnrichment}
              onClose={handleCloseDetail}
            />
          )}
        </div>

        {/* Bottom Section: Cameras + Insights */}
        <div className="flex h-64 border-t border-gray-200 bg-white shrink-0">
          {/* Cameras Panel */}
          <div className="w-80 border-r border-gray-100 overflow-hidden">
            <CamerasPriorityPanel
              cameras={cameras}
              selectedId={selectedType === "camera" ? selectedId : null}
              onSelect={handleSelectCamera}
            />
          </div>

          {/* Insights Panel */}
          <div className="flex-1 overflow-hidden">
            <InsightsPanel
              brain2={analysisResult?.brain2}
              roads={roads}
              cameras={cameras}
            />
          </div>
        </div>
      </div>
    </div>
  );
}