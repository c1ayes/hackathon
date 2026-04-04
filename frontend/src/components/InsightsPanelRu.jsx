import { useState } from "react";
import { formatTenge, getOverlapTypeLabel } from "../utils/formatters";

function ConfidenceMeter({ score }) {
  const filledBlocks = Math.round((score / 100) * 5);
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-4 w-2.5 rounded-sm ${i < filledBlocks ? color : "bg-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-700">{score}%</span>
    </div>
  );
}

function TabButton({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-t border-l border-r border-gray-200 bg-white text-blue-600"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">
          {badge}
        </span>
      )}
    </button>
  );
}

function UrgencyArrow({ adjustment }) {
  if (adjustment === "higher") return <span className="font-bold text-red-500">↑</span>;
  if (adjustment === "lower") return <span className="font-bold text-green-500">↓</span>;
  return <span className="text-gray-400">—</span>;
}

function EnrichmentCard({ item, type, entityName }) {
  const isRoad = type === "road";
  const note = isRoad ? item.seasonal_note : item.survivorship_bias_note;
  const noteLabel = isRoad ? "Сезонность" : "Систематическая ошибка выжившего";

  return (
    <div className="mb-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{isRoad ? "🛣️" : "📷"}</span>
          <span className="text-sm font-medium text-gray-900">{entityName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-400">Срочность:</span>
          <UrgencyArrow adjustment={item.urgency_adjustment} />
        </div>
      </div>

      <div className="mb-2">
        <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">Скрытые риски</div>
        <div className="text-sm text-gray-700">{item.hidden_risks || "Не указаны"}</div>
      </div>

      <div className="mb-2">
        <div className="mb-1 text-xs uppercase tracking-wider text-gray-400">Обоснование</div>
        <div className="text-xs leading-relaxed text-gray-600">
          {item.reasoning || "Дополнительное обоснование не получено"}
        </div>
      </div>

      {note && (
        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
          <div className="flex items-start gap-1.5">
            <span className="text-amber-500">⚠️</span>
            <div>
              <div className="text-xs font-medium text-amber-700">{noteLabel}</div>
              <div className="mt-0.5 text-xs text-amber-600">{note}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnrichmentTab({ enrichment, roads, cameras }) {
  const roadEnrichments = enrichment?.roads || [];
  const cameraEnrichments = enrichment?.cameras || [];

  const getRoadName = (segmentId) => {
    const road = roads?.find((r) => r.id === segmentId || r.segment_id === segmentId);
    return road?.name || road?.street_name || segmentId;
  };

  const getCameraName = (intersectionId) => {
    const camera = cameras?.find(
      (c) => c.id === intersectionId || c.intersection_id === intersectionId
    );
    return camera?.name || camera?.intersection_name || intersectionId;
  };

  if (roadEnrichments.length === 0 && cameraEnrichments.length === 0) {
    return <div className="py-8 text-center text-sm text-gray-400">Нет данных для обогащения</div>;
  }

  return (
    <div className="space-y-4">
      {roadEnrichments.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Дороги ({roadEnrichments.length})
          </div>
          {roadEnrichments.map((item, idx) => (
            <EnrichmentCard
              key={item.segment_id || idx}
              item={item}
              type="road"
              entityName={getRoadName(item.segment_id)}
            />
          ))}
        </div>
      )}

      {cameraEnrichments.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Камеры ({cameraEnrichments.length})
          </div>
          {cameraEnrichments.map((item, idx) => (
            <EnrichmentCard
              key={item.intersection_id || idx}
              item={item}
              type="camera"
              entityName={getCameraName(item.intersection_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OverlapCard({ overlap }) {
  return (
    <div className="mb-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">🔗</span>
        <span className="text-sm font-medium text-gray-900">
          {overlap.road_segment} ↔ {overlap.camera_zone}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {overlap.overlap_type && (
          <div className="flex items-start gap-2">
            <span className="w-24 shrink-0 text-xs text-gray-400">Тип:</span>
            <span className="font-medium text-gray-700">
              {getOverlapTypeLabel(overlap.overlap_type)}
            </span>
          </div>
        )}

        {overlap.causal_explanation && (
          <div className="flex items-start gap-2">
            <span className="w-24 shrink-0 text-xs text-gray-400">Объяснение:</span>
            <span className="text-xs italic text-gray-600">"{overlap.causal_explanation}"</span>
          </div>
        )}

        {overlap.compounding_risk && (
          <div className="flex items-start gap-2">
            <span className="w-24 shrink-0 text-xs text-gray-400">Риск:</span>
            <span className="text-xs text-red-600">"{overlap.compounding_risk}"</span>
          </div>
        )}

        {overlap.recommendation && (
          <div className="mt-1 rounded-md border border-blue-200 bg-blue-50 p-2">
            <div className="mb-1 text-xs font-medium text-blue-700">Рекомендация:</div>
            <div className="text-xs text-blue-600">{overlap.recommendation}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverlapsTab({ overlaps }) {
  const activeOverlaps = overlaps?.filter((o) => o.overlap_exists) || [];

  if (activeOverlaps.length === 0) {
    return <div className="py-8 text-center text-sm text-gray-400">Пересечений не обнаружено</div>;
  }

  return (
    <div>
      {activeOverlaps.map((overlap, idx) => (
        <OverlapCard key={idx} overlap={overlap} />
      ))}
    </div>
  );
}

function TypeAAnomalyCard({ anomaly }) {
  return (
    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="mb-2 flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <div>
          <div className="text-sm font-medium text-amber-800">Неожиданный результат</div>
          <div className="text-xs text-amber-600">
            {anomaly.entity} ({anomaly.entity_type === "road" ? "дорога" : "камера"})
          </div>
        </div>
        <div className="ml-auto text-xs font-medium text-amber-600">
          {anomaly.confidence_pct}%
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-0.5 text-xs uppercase tracking-wider text-amber-500">Наблюдение</div>
          <div className="text-sm text-amber-700">{anomaly.observation}</div>
        </div>
        <div>
          <div className="mb-0.5 text-xs uppercase tracking-wider text-amber-500">
            Вероятное объяснение
          </div>
          <div className="text-xs text-amber-600">{anomaly.likely_explanation}</div>
        </div>
      </div>
    </div>
  );
}

function TypeBAnomalyCard({ anomaly }) {
  return (
    <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <div className="mb-2 flex items-start gap-2">
        <span className="text-lg">🚨</span>
        <div>
          <div className="text-sm font-medium text-red-800">Проблема данных</div>
          <div className="text-xs text-red-600">
            {anomaly.entity} ({anomaly.entity_type === "road" ? "дорога" : "камера"})
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="mb-0.5 text-xs uppercase tracking-wider text-red-500">
            Подозрительный паттерн
          </div>
          <div className="text-sm text-red-700">{anomaly.suspicious_pattern}</div>
        </div>
        <div>
          <div className="mb-0.5 text-xs uppercase tracking-wider text-red-500">
            Почему неправдоподобно
          </div>
          <div className="text-xs text-red-600">{anomaly.why_implausible}</div>
        </div>
        <div>
          <div className="mb-0.5 text-xs uppercase tracking-wider text-red-500">
            Ожидаемые данные
          </div>
          <div className="text-xs italic text-red-600">{anomaly.expected_correct_data}</div>
        </div>
      </div>
    </div>
  );
}

function AnomaliesTab({ anomalies }) {
  const typeA = anomalies?.type_a || [];
  const typeB = anomalies?.type_b || [];

  if (typeA.length === 0 && typeB.length === 0) {
    return <div className="py-8 text-center text-sm text-gray-400">Аномалий не обнаружено</div>;
  }

  return (
    <div className="space-y-4">
      {typeA.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-amber-600">
            Тип A: неожиданные результаты ({typeA.length})
          </div>
          {typeA.map((anomaly, idx) => (
            <TypeAAnomalyCard key={idx} anomaly={anomaly} />
          ))}
        </div>
      )}

      {typeB.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-red-600">
            Тип B: проблемы данных ({typeB.length})
          </div>
          {typeB.map((anomaly, idx) => (
            <TypeBAnomalyCard key={idx} anomaly={anomaly} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickDecisionStrip({ executiveSummary, recommendations }) {
  if (!executiveSummary) return null;

  const topRecommendation = recommendations?.[0];

  return (
    <div className="shrink-0 border-b border-gray-200 bg-slate-900 px-4 py-3 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
            Сводка решений
          </div>
          <div className="mt-1 text-sm font-semibold leading-5">
            {executiveSummary.headline || "Сводка по району"}
          </div>
          {topRecommendation?.recommendation && (
            <div className="mt-2 text-xs leading-5 text-slate-300">
              Приоритетное действие: {topRecommendation.recommendation}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <div className="text-slate-400">Экономия</div>
            <div className="mt-1 font-semibold text-white">
              {formatTenge(executiveSummary.total_potential_savings_tenge || 0, true)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <div className="text-slate-400">Доход</div>
            <div className="mt-1 font-semibold text-white">
              {formatTenge(executiveSummary.total_projected_revenue_tenge || 0, true)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <div className="text-slate-400">Дорог в риске</div>
            <div className="mt-1 font-semibold text-white">
              {executiveSummary.critical_road_segments || 0}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <div className="text-slate-400">Слепых зон</div>
            <div className="mt-1 font-semibold text-white">
              {executiveSummary.unmonitored_camera_zones || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPanelRu({
  brain2,
  roads,
  cameras,
  executiveSummary,
  recommendations,
}) {
  const [activeTab, setActiveTab] = useState("enrichment");

  if (!brain2) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="text-center">
          <span className="mb-3 block text-3xl">🧠</span>
          <div className="mb-1 text-sm font-medium text-gray-500">
            Анализ Brain 2 недоступен
          </div>
          <div className="text-xs text-gray-400">(требуется Ollama)</div>
        </div>
      </div>
    );
  }

  const overlapsCount = brain2.overlaps?.filter((o) => o.overlap_exists)?.length || 0;
  const anomaliesCount =
    (brain2.anomalies?.type_a?.length || 0) + (brain2.anomalies?.type_b?.length || 0);
  const confidenceScore = brain2.overall_confidence?.score_pct || 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <QuickDecisionStrip executiveSummary={executiveSummary} recommendations={recommendations} />

      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="text-sm font-medium text-gray-900">Анализ Brain 2</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Уверенность:</span>
            <ConfidenceMeter score={confidenceScore} />
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-gray-200 bg-gray-100 px-2 pt-2">
        <div className="flex gap-1">
          <TabButton active={activeTab === "enrichment"} onClick={() => setActiveTab("enrichment")}>
            Обогащение
          </TabButton>
          <TabButton
            active={activeTab === "overlaps"}
            onClick={() => setActiveTab("overlaps")}
            badge={overlapsCount}
          >
            Пересечения
          </TabButton>
          <TabButton
            active={activeTab === "anomalies"}
            onClick={() => setActiveTab("anomalies")}
            badge={anomaliesCount}
          >
            Аномалии
          </TabButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
        {activeTab === "enrichment" && (
          <EnrichmentTab enrichment={brain2.enrichment} roads={roads} cameras={cameras} />
        )}
        {activeTab === "overlaps" && <OverlapsTab overlaps={brain2.overlaps} />}
        {activeTab === "anomalies" && <AnomaliesTab anomalies={brain2.anomalies} />}
      </div>

      {brain2.overall_confidence?.interpretation && (
        <div className="shrink-0 border-t border-blue-100 bg-blue-50 px-4 py-2">
          <div className="text-xs text-blue-600">
            <span className="font-medium">Интерпретация:</span>{" "}
            {brain2.overall_confidence.interpretation}
          </div>
        </div>
      )}
    </div>
  );
}
