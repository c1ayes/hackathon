import { useEffect, useMemo, useRef, useState } from "react";
import ExecutiveSummary from "./components/ExecutiveSummary";
import MapView from "./components/MapView";
import DetailPanel from "./components/DetailPanel";
import RoadsPriorityPanel from "./components/RoadsPriorityPanel";
import CamerasPriorityPanel from "./components/CamerasPriorityPanel";
import InsightsPanel from "./components/InsightsPanelRu";
import ActionPlannerPanel from "./components/ActionPlannerPanel";
import {
  checkHealth,
  checkOllamaHealth,
  getCityOverview,
  runAnalysisWithFallback,
} from "./services/api";
import { formatTenge } from "./utils/formatters";

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function getVisibleDistricts(cityOverview) {
  if (!cityOverview?.districts) return [];
  return [...cityOverview.districts].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

function normalizeDistrictName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/district/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getActiveAlertCount(roads) {
  return roads.filter((road) => {
    const days = road?.financial_impact?.estimated_days_until_failure;
    return typeof days === "number" && days < 30;
  }).length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const appRef = useRef(null);
  const mainRef = useRef(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [serviceOnline, setServiceOnline] = useState(null);
  const [brain2Online, setBrain2Online] = useState(null);
  const [cityOverview, setCityOverview] = useState(null);
  const [districtFilter, setDistrictFilter] = useState("all");
  const [entityMode, setEntityMode] = useState("both");
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [detailWidth, setDetailWidth] = useState(520);
  const [cameraPanelWidth, setCameraPanelWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(256);
  const [activeResize, setActiveResize] = useState(null);

  useEffect(() => {
    checkHealth()
      .then(() => setServiceOnline(true))
      .catch(() => setServiceOnline(false));

    checkOllamaHealth()
      .then((data) => setBrain2Online(Boolean(data.ollama_available)))
      .catch(() => setBrain2Online(false));

    getCityOverview()
      .then(setCityOverview)
      .catch((err) => console.error("City overview failed:", err));
  }, []);

  useEffect(() => {
    if (!activeResize) return undefined;

    function handleMove(event) {
      const appRect = appRef.current?.getBoundingClientRect();
      const mainRect = mainRef.current?.getBoundingClientRect();

      if (activeResize === "sidebar" && appRect) {
        setSidebarWidth(clamp(event.clientX - appRect.left, 220, 420));
      }

      if (activeResize === "detail" && appRect) {
        setDetailWidth(clamp(appRect.right - event.clientX, 460, 760));
      }

      if (activeResize === "camera" && mainRect) {
        setCameraPanelWidth(clamp(event.clientX - mainRect.left, 260, 520));
      }

      if (activeResize === "bottom" && mainRect) {
        setBottomHeight(clamp(mainRect.bottom - event.clientY, 220, 420));
      }
    }

    function handleUp() {
      setActiveResize(null);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [activeResize]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setSelectedType(null);

    try {
      const { data, mode } = await runAnalysisWithFallback({ topN: 5 });
      setAnalysisResult(data);
      setAnalysisMode(mode);
      setBrain2Online(Boolean(data?.brain2));
    } catch (err) {
      setError(err.message || "Ошибка анализа. Проверьте AI сервис.");
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }

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

  function getSelectedData() {
    if (!analysisResult) return null;
    if (selectedType === "road") {
      return analysisResult.brain1_roads?.segments?.find((s) => s.segment_id === selectedId);
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
      return analysisResult.brain2.enrichment.roads?.find((e) => e.segment_id === selectedId);
    }
    if (selectedType === "camera") {
      return analysisResult.brain2.enrichment.cameras?.find(
        (e) => e.intersection_id === selectedId
      );
    }
    return null;
  }

  const selectedData = selectedId ? getSelectedData() : null;
  const selectedEnrichment = selectedId ? getSelectedEnrichment() : null;

  const roads = analysisResult?.brain1_roads?.segments || [];
  const cameras = analysisResult?.brain1_cameras?.intersections || [];
  const overlaps = analysisResult?.brain2?.overlaps || [];

  const filteredRoads = useMemo(() => {
    if (districtFilter === "all") return roads;
    const targetDistrict = normalizeDistrictName(districtFilter);
    return roads.filter((road) => normalizeDistrictName(road.district) === targetDistrict);
  }, [districtFilter, roads]);

  const filteredCameras = useMemo(() => {
    if (districtFilter === "all") return cameras;
    const targetDistrict = normalizeDistrictName(districtFilter);
    return cameras.filter((camera) => normalizeDistrictName(camera.district) === targetDistrict);
  }, [districtFilter, cameras]);

  const visibleRoads = entityMode === "cameras" ? [] : filteredRoads;
  const visibleCameras = entityMode === "roads" ? [] : filteredCameras;
  const districts = getVisibleDistricts(cityOverview);
  const backendSegments = cityOverview?.segments || [];

  const currentDistrict =
    districtFilter === "all"
      ? {
          budget_available: districts.reduce(
            (sum, district) => sum + (district.budget_available || 0),
            0
          ),
        }
      : districts.find((district) => district.name === districtFilter) || null;

  const activeAlertCount = getActiveAlertCount(filteredRoads);

  return (
    <div ref={appRef} className="flex h-full overflow-hidden bg-gray-100 select-none">
      <aside
        style={{ width: sidebarWidth }}
        className="flex shrink-0 flex-col border-r border-gray-200 bg-white"
      >
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="text-sm font-semibold leading-tight text-gray-900">Smart City</div>
          <div className="mt-0.5 text-xs text-gray-500">Панель управления инфраструктурой</div>
          <div className="mt-1 text-xs text-gray-400">Алматы, 2025</div>
        </div>

        <div className="border-b border-gray-100 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                serviceOnline === null ? "bg-gray-300" : serviceOnline ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-gray-600">
              AI сервис:{" "}
              {serviceOnline === null ? "проверка..." : serviceOnline ? "онлайн" : "офлайн"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                brain2Online === null ? "bg-gray-300" : brain2Online ? "bg-green-500" : "bg-amber-500"
              }`}
            />
            <span className="text-gray-600">
              Brain 2:{" "}
              {brain2Online === null ? "проверка..." : brain2Online ? "доступен" : "недоступен"}
            </span>
          </div>
          {analysisMode && (
            <div className="mt-1 text-xs text-gray-400">
              Режим: {analysisMode === "full" ? "Полный (Brain 1 + Brain 2)" : "Только Brain 1"}
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={handleAnalyze}
            disabled={loading || !serviceOnline}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              loading
                ? "cursor-wait bg-gray-200 text-gray-500"
                : serviceOnline === false
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm"
            }`}
          >
            {loading ? "Анализ..." : "Запустить анализ"}
          </button>
        </div>

        {error && (
          <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden border-t border-gray-100">
          <RoadsPriorityPanel
            roads={visibleRoads}
            selectedId={selectedType === "road" ? selectedId : null}
            onSelect={handleSelectRoad}
          />
        </div>
      </aside>

      <div
        onMouseDown={() => setActiveResize("sidebar")}
        className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-200 active:bg-blue-300 transition-colors"
        aria-hidden="true"
      />

      <div ref={mainRef} className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                {cityOverview?.city || "Almaty"}
              </span>
              <select
                value={districtFilter}
                onChange={(event) => setDistrictFilter(event.target.value)}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 outline-none"
              >
                <option value="all">Все районы</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.name}>
                    {district.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                <ToggleButton active={entityMode === "roads"} onClick={() => setEntityMode("roads")}>
                  Дороги
                </ToggleButton>
                <ToggleButton
                  active={entityMode === "cameras"}
                  onClick={() => setEntityMode("cameras")}
                >
                  Камеры
                </ToggleButton>
                <ToggleButton active={entityMode === "both"} onClick={() => setEntityMode("both")}>
                  Оба
                </ToggleButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                Бюджет: {formatTenge(currentDistrict?.budget_available ?? 0, true)}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 font-medium ${
                  activeAlertCount > 0 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {activeAlertCount > 0
                  ? `Критично в этом месяце: ${activeAlertCount}`
                  : "Критичных окон < 30 дней нет"}
              </span>
            </div>
          </div>
        </div>

        {analysisResult && <ExecutiveSummary data={analysisResult} />}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="relative min-w-0 flex-1">
            {!analysisResult && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="p-8 text-center">
                  <div className="mb-4 text-6xl">🗺️</div>
                  <h2 className="mb-2 text-xl font-semibold text-gray-700">
                    Панель управления инфраструктурой Алматы
                  </h2>
                  <p className="mb-4 text-gray-500">
                    Нажмите «Запустить анализ», чтобы получить данные по дорогам и камерам.
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80">
                <div className="p-8 text-center">
                  <div className="mb-4 text-5xl animate-pulse">🧠</div>
                  <h2 className="mb-2 text-lg font-semibold text-gray-700">Анализ инфраструктуры...</h2>
                  <p className="text-sm text-gray-500">
                    Brain 1: расчёт приоритетов
                    <br />
                    Brain 2: LLM-обогащение
                  </p>
                </div>
              </div>
            )}

            {analysisResult && (
              <MapView
                roads={visibleRoads}
                cameras={visibleCameras}
                overlaps={overlaps}
                selectedId={selectedId}
                districtLabel={districtFilter === "all" ? "Все районы" : districtFilter}
                onSelectRoad={handleSelectRoad}
                onSelectCamera={handleSelectCamera}
              />
            )}
          </div>

          {selectedData && (
            <>
              <div
                onMouseDown={() => setActiveResize("detail")}
                className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-200 active:bg-blue-300 transition-colors"
                aria-hidden="true"
              />
              <div style={{ width: detailWidth }} className="h-full shrink-0">
                <DetailPanel
                  type={selectedType}
                  data={selectedData}
                  enrichment={selectedEnrichment}
                  onClose={handleCloseDetail}
                />
              </div>
            </>
          )}
        </div>

        <div
          onMouseDown={() => setActiveResize("bottom")}
          className="h-1.5 shrink-0 cursor-row-resize bg-transparent hover:bg-blue-200 active:bg-blue-300 transition-colors"
          aria-hidden="true"
        />

        <div
          style={{ height: bottomHeight }}
          className="flex shrink-0 border-t border-gray-200 bg-white"
        >
          {entityMode !== "roads" && (
            <>
              <div
                style={{ width: cameraPanelWidth }}
                className="shrink-0 overflow-hidden border-r border-gray-100"
              >
                <CamerasPriorityPanel
                  cameras={visibleCameras}
                  selectedId={selectedType === "camera" ? selectedId : null}
                  onSelect={handleSelectCamera}
                />
              </div>
              <div
                onMouseDown={() => setActiveResize("camera")}
                className="w-1.5 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-200 active:bg-blue-300 transition-colors"
                aria-hidden="true"
              />
            </>
          )}

          {selectedType === "road" && selectedData && (
            <div className="w-[380px] shrink-0 overflow-hidden border-r border-gray-100">
              <ActionPlannerPanel selectedRoad={selectedData} backendSegments={backendSegments} />
            </div>
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <InsightsPanel
              brain2={analysisResult?.brain2}
              roads={visibleRoads}
              cameras={visibleCameras}
              executiveSummary={analysisResult?.executive_summary}
              recommendations={analysisResult?.recommendations}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
