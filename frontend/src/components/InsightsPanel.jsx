import { useState } from "react";
import { getOverlapTypeLabel } from "../utils/formatters";

function ConfidenceMeter({ score }) {
  const filledBlocks = Math.round((score / 100) * 5);
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-4 rounded-sm ${i < filledBlocks ? color : "bg-gray-200"}`}
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
      className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative ${
        active
          ? "bg-white text-blue-600 border-t border-l border-r border-gray-200"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600">
          {badge}
        </span>
      )}
    </button>
  );
}

function UrgencyArrow({ adjustment }) {
  if (adjustment === "higher") {
    return <span className="text-red-500 font-bold">↑</span>;
  }
  if (adjustment === "lower") {
    return <span className="text-green-500 font-bold">↓</span>;
  }
  return <span className="text-gray-400">—</span>;
}

function EnrichmentCard({ item, type, entityName }) {
  const isRoad = type === "road";
  const note = isRoad ? item.seasonal_note : item.survivorship_bias_note;
  const noteLabel = isRoad ? "Сезонность" : "Систематическая ошибка выжившего";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-start justify-between mb-2">
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
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Скрытые риски</div>
        <div className="text-sm text-gray-700">{item.hidden_risks}</div>
      </div>

      <div className="mb-2">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Обоснование</div>
        <div className="text-xs text-gray-600 leading-relaxed">{item.reasoning}</div>
      </div>

      {note && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
          <div className="flex items-start gap-1.5">
            <span className="text-amber-500">⚠️</span>
            <div>
              <div className="text-xs font-medium text-amber-700">{noteLabel}</div>
              <div className="text-xs text-amber-600 mt-0.5">{note}</div>
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
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Нет данных для обогащения
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {roadEnrichments.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
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
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
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
    <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🔗</span>
        <span className="text-sm font-medium text-gray-900">
          {overlap.road_segment} ↔ {overlap.camera_zone}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        {overlap.overlap_type && (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 text-xs w-24 shrink-0">Тип:</span>
            <span className="text-gray-700 font-medium">
              {getOverlapTypeLabel(overlap.overlap_type)}
            </span>
          </div>
        )}

        {overlap.causal_explanation && (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 text-xs w-24 shrink-0">Объяснение:</span>
            <span className="text-gray-600 text-xs italic">"{overlap.causal_explanation}"</span>
          </div>
        )}

        {overlap.compounding_risk && (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 text-xs w-24 shrink-0">Риск:</span>
            <span className="text-red-600 text-xs">"{overlap.compounding_risk}"</span>
          </div>
        )}

        {overlap.recommendation && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mt-1">
            <div className="text-xs font-medium text-blue-700 mb-1">Рекомендация:</div>
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
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Пересечений не обнаружено
      </div>
    );
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
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">⚠️</span>
        <div>
          <div className="text-sm font-medium text-amber-800">Неожиданный результат</div>
          <div className="text-xs text-amber-600">
            {anomaly.entity} ({anomaly.entity_type === "road" ? "дорога" : "камера"})
          </div>
        </div>
        <div className="ml-auto text-xs text-amber-600 font-medium">
          {anomaly.confidence_pct}%
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs text-amber-500 uppercase tracking-wider mb-0.5">
            Наблюдение
          </div>
          <div className="text-sm text-amber-700">{anomaly.observation}</div>
        </div>
        <div>
          <div className="text-xs text-amber-500 uppercase tracking-wider mb-0.5">
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
    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
      <div className="flex items-start gap-2 mb-2">
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
          <div className="text-xs text-red-500 uppercase tracking-wider mb-0.5">
            Подозрительный паттерн
          </div>
          <div className="text-sm text-red-700">{anomaly.suspicious_pattern}</div>
        </div>
        <div>
          <div className="text-xs text-red-500 uppercase tracking-wider mb-0.5">
            Почему неправдоподобно
          </div>
          <div className="text-xs text-red-600">{anomaly.why_implausible}</div>
        </div>
        <div>
          <div className="text-xs text-red-500 uppercase tracking-wider mb-0.5">
            Ожидаемые данные
          </div>
          <div className="text-xs text-red-600 italic">{anomaly.expected_correct_data}</div>
        </div>
      </div>
    </div>
  );
}

function AnomaliesTab({ anomalies }) {
  const typeA = anomalies?.type_a || [];
  const typeB = anomalies?.type_b || [];

  if (typeA.length === 0 && typeB.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        Аномалий не обнаружено
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {typeA.length > 0 && (
        <div>
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
            Тип A: Неожиданные результаты ({typeA.length})
          </div>
          {typeA.map((anomaly, idx) => (
            <TypeAAnomalyCard key={idx} anomaly={anomaly} />
          ))}
        </div>
      )}

      {typeB.length > 0 && (
        <div>
          <div className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2">
            Тип B: Проблемы данных ({typeB.length})
          </div>
          {typeB.map((anomaly, idx) => (
            <TypeBAnomalyCard key={idx} anomaly={anomaly} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InsightsPanel({ brain2, roads, cameras }) {
  const [activeTab, setActiveTab] = useState("enrichment");

  if (!brain2) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <span className="text-3xl mb-3 block">🧠</span>
          <div className="text-sm font-medium text-gray-500 mb-1">
            Brain 2 анализ недоступен
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="text-sm font-medium text-gray-900">Анализ Brain 2</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Уверенность:</span>
          <ConfidenceMeter score={confidenceScore} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 px-2 pt-2 flex gap-1 border-b border-gray-200">
        <TabButton
          active={activeTab === "enrichment"}
          onClick={() => setActiveTab("enrichment")}
        >
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

      {/* Tab Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div
          className={`transition-opacity duration-200 ${
            activeTab === "enrichment" ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          {activeTab === "enrichment" && (
            <EnrichmentTab
              enrichment={brain2.enrichment}
              roads={roads}
              cameras={cameras}
            />
          )}
        </div>

        <div
          className={`transition-opacity duration-200 ${
            activeTab === "overlaps" ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          {activeTab === "overlaps" && <OverlapsTab overlaps={brain2.overlaps} />}
        </div>

        <div
          className={`transition-opacity duration-200 ${
            activeTab === "anomalies" ? "opacity-100" : "opacity-0 hidden"
          }`}
        >
          {activeTab === "anomalies" && <AnomaliesTab anomalies={brain2.anomalies} />}
        </div>
      </div>

      {/* Footer with interpretation */}
      {brain2.overall_confidence?.interpretation && (
        <div className="bg-blue-50 border-t border-blue-100 px-4 py-2">
          <div className="text-xs text-blue-600">
            <span className="font-medium">Интерпретация:</span>{" "}
            {brain2.overall_confidence.interpretation}
          </div>
        </div>
      )}
    </div>
  );
}
