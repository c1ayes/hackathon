import { useMemo, useState } from "react";
import { createForecast, createRecommendation } from "../services/api";
import { formatPercent, formatTenge } from "../utils/formatters";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/district/g, "")
    .replace(/ave/g, "")
    .replace(/street/g, "")
    .replace(/st\./g, "")
    .replace(/junction/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, " ")
    .trim();
}

function scoreCandidate(selectedRoad, segment) {
  const selectedName = normalizeText(selectedRoad?.name);
  const backendName = normalizeText(segment?.name);
  const selectedDistrict = normalizeText(selectedRoad?.district);
  const backendDistrict = normalizeText(segment?.district_name);

  let score = 0;

  if (selectedDistrict && backendDistrict && backendDistrict.includes(selectedDistrict)) {
    score += 4;
  }

  for (const token of selectedName.split(" ")) {
    if (token && backendName.includes(token)) {
      score += 2;
    }
  }

  return score;
}

function resolveBackendSegment(selectedRoad, backendSegments) {
  if (!selectedRoad || !backendSegments?.length) return null;

  let best = null;
  let bestScore = -1;

  for (const segment of backendSegments) {
    const score = scoreCandidate(selectedRoad, segment);
    if (score > bestScore) {
      best = segment;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : backendSegments[0];
}

export default function ActionPlannerPanel({ selectedRoad, backendSegments = [] }) {
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingForecastId, setLoadingForecastId] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [forecastByActionId, setForecastByActionId] = useState({});
  const [error, setError] = useState(null);

  const backendSegment = useMemo(
    () => resolveBackendSegment(selectedRoad, backendSegments),
    [backendSegments, selectedRoad]
  );

  const scenario = selectedRoad?.camera_coverage_score < 0.45 ? "combined" : "road_damage";

  async function handleLoadActions() {
    if (!backendSegment?.id) return;

    setLoadingActions(true);
    setError(null);
    setForecastByActionId({});

    try {
      const data = await createRecommendation(backendSegment.id, scenario, "ru");
      setRecommendation(data);
    } catch (err) {
      setError(err.message || "Не удалось получить действия.");
    } finally {
      setLoadingActions(false);
    }
  }

  async function handleForecast(actionId) {
    setLoadingForecastId(actionId);
    setError(null);

    try {
      const forecast = await createForecast(actionId);
      setForecastByActionId((current) => ({ ...current, [actionId]: forecast }));
    } catch (err) {
      setError(err.message || "Не удалось построить прогноз.");
    } finally {
      setLoadingForecastId(null);
    }
  }

  if (!selectedRoad) {
    return (
      <div className="h-full rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm font-semibold text-gray-900">План действий</div>
        <p className="mt-2 text-sm text-gray-500">
          Выберите дорожный сегмент на карте или в очереди слева, чтобы получить действия и прогноз.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="text-sm font-semibold text-gray-900">План действий</div>
        <div className="mt-1 text-xs text-gray-500">{selectedRoad.name}</div>
        {backendSegment && (
          <div className="mt-1 text-[11px] text-gray-400">
            Источник действий: {backendSegment.name}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs uppercase tracking-wide text-slate-400">Что можно сделать</div>
          <div className="mt-2 text-sm text-slate-700">
            Сгенерируем управленческие действия для выбранного сегмента, затем по каждому действию можно получить
            прогноз эффекта.
          </div>
          <button
            onClick={handleLoadActions}
            disabled={loadingActions || !backendSegment?.id}
            className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
              loadingActions || !backendSegment?.id
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {loadingActions ? "Генерируем действия..." : "Показать действия"}
          </button>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

        {recommendation && (
          <div className="space-y-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="text-xs uppercase tracking-wide text-emerald-600">Сводка</div>
              <div className="mt-1 text-sm text-emerald-900">{recommendation.summary}</div>
              <div className="mt-2 text-xs text-emerald-700">
                Приоритет: {Math.round(recommendation.priority_score)}/100
              </div>
            </div>

            {recommendation.actions.map((action) => {
              const forecast = forecastByActionId[action.id];
              return (
                <div key={action.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900">{action.title}</div>
                      <div className="mt-1 text-xs text-gray-500">{action.description}</div>
                    </div>
                    <button
                      onClick={() => handleForecast(action.id)}
                      disabled={loadingForecastId === action.id}
                      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                        loadingForecastId === action.id
                          ? "cursor-wait bg-gray-200 text-gray-500"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {loadingForecastId === action.id ? "Считаем..." : "Прогноз"}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-gray-400">Эффект</div>
                      <div className="mt-1 font-medium text-gray-800">{action.effect_text}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-gray-400">Срок</div>
                      <div className="mt-1 font-medium text-gray-800">{action.time_horizon}</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-gray-400">Стоимость</div>
                      <div className="mt-1 font-medium text-gray-800">
                        {formatTenge(action.implementation_cost, true)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="text-gray-400">Снижение риска</div>
                      <div className="mt-1 font-medium text-gray-800">{formatPercent(action.risk_reduction)}</div>
                    </div>
                  </div>

                  {forecast && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <div className="text-xs uppercase tracking-wide text-blue-600">Прогноз по действию</div>
                      <div className="mt-1 text-sm text-blue-900">{forecast.forecast_summary}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                          <div className="text-blue-500">Экономия</div>
                          <div className="mt-1 font-medium text-blue-900">
                            {formatTenge(forecast.projected_savings, true)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                          <div className="text-blue-500">Доход</div>
                          <div className="mt-1 font-medium text-blue-900">
                            {formatTenge(forecast.projected_revenue, true)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                          <div className="text-blue-500">Изменение риска</div>
                          <div className="mt-1 font-medium text-blue-900">
                            {formatPercent(Math.abs(forecast.projected_risk_change))}
                          </div>
                        </div>
                        <div className="rounded-lg bg-white/70 px-3 py-2">
                          <div className="text-blue-500">Снижение аварий</div>
                          <div className="mt-1 font-medium text-blue-900">
                            {forecast.projected_accident_reduction}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
