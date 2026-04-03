import { formatTenge, formatMonths, getSeverityColor } from '../utils/formatters';

/**
 * Single camera card displaying priority ranking, status, and ROI metrics
 */
function CameraCard({ camera, rank, isSelected, onSelect }) {
  const {
    intersection_id,
    name,
    is_monitored,
    priority_score,
    roi,
    is_critical_gap,
    is_high_violation_zone,
    is_survivorship_bias_case,
  } = camera;

  const scoreColor = getSeverityColor(priority_score);
  const scorePercent = Math.min(100, Math.max(0, priority_score));

  return (
    <div
      onClick={() => onSelect(intersection_id)}
      className={`
        bg-white border rounded-lg p-3 cursor-pointer transition-all duration-150
        hover:shadow-md hover:border-blue-300
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : 'border-gray-200 shadow-sm'}
      `}
    >
      {/* Header: Rank and Name */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className="text-xs font-bold text-white px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: scoreColor }}
        >
          #{rank}
        </span>
        <span className="text-sm font-medium text-gray-900 leading-tight">
          {name}
        </span>
      </div>

      {/* Status */}
      <div className="mb-2">
        {is_monitored ? (
          <span className="text-xs text-green-600 font-medium">
            ✅ Активна
          </span>
        ) : (
          <span className="text-xs text-red-500 font-medium">
            ❌ Не установлена
          </span>
        )}
      </div>

      {/* Priority Score Bar */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${scorePercent}%`,
                backgroundColor: scoreColor,
              }}
            />
          </div>
          <span
            className="text-xs font-bold min-w-[24px] text-right"
            style={{ color: scoreColor }}
          >
            {Math.round(priority_score)}
          </span>
        </div>
      </div>

      {/* ROI Metrics */}
      {roi && (
        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
          <span className="flex items-center gap-1">
            💰 {formatTenge(roi.estimated_annual_revenue_tenge, true)}/год
          </span>
          {roi.is_positive_roi && roi.breakeven_months && (
            <span className="flex items-center gap-1">
              ⏱️ {formatMonths(roi.breakeven_months)}
            </span>
          )}
        </div>
      )}

      {/* Warning Badges */}
      <div className="flex flex-wrap gap-1">
        {is_survivorship_bias_case && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
            ⚠️ Слепая зона
          </span>
        )}
        {is_critical_gap && (
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
            🔴 Критический разрыв
          </span>
        )}
        {is_high_violation_zone && (
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
            ⚡ Высокие нарушения
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CamerasPriorityPanel - Right panel showing camera zones ranked by priority score
 * 
 * @param {Object} props
 * @param {Array} props.cameras - Array of Brain1CameraZone objects (sorted by priority_score)
 * @param {string} props.selectedId - Currently selected intersection ID
 * @param {Function} props.onSelect - Function called when camera clicked (receives intersection_id)
 */
export default function CamerasPriorityPanel({ cameras = [], selectedId, onSelect }) {
  const totalCameras = cameras.length;
  const blindSpots = cameras.filter(c => c.is_survivorship_bias_case || !c.is_monitored).length;

  const handleSelect = (intersectionId) => {
    if (onSelect) {
      onSelect(intersectionId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            📷 Камеры
          </h2>
          <span className="text-xs text-gray-400">↓↑</span>
        </div>
        <div className="text-xs text-gray-500">
          Всего: <span className="font-medium text-gray-700">{totalCameras}</span>
          <span className="mx-1.5">|</span>
          Слепых зон: <span className="font-medium text-amber-600">{blindSpots}</span>
        </div>
      </div>

      {/* Scrollable Camera List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {cameras.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              Нет данных о камерах
            </div>
          ) : (
            cameras.map((camera, index) => (
              <CameraCard
                key={camera.intersection_id}
                camera={camera}
                rank={index + 1}
                isSelected={selectedId === camera.intersection_id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
