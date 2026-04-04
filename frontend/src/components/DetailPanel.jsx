import {
  formatTenge,
  formatPercent,
  formatMonths,
  getSeverityLabel,
  getSeverityColor,
  getSeverityBadgeClass,
  getRoadClassLabel,
  getTrafficTierLabel,
} from '../utils/formatters';

/**
 * Reusable block container
 */
function Block({ children, className = '' }) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Block section label
 */
function BlockLabel({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </div>
  );
}

/**
 * Key-value row
 */
function Row({ label, value, valueClass = 'text-gray-900', icon }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <span className={`text-xs font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

/**
 * Progress bar component
 */
function ProgressBar({ value, max = 100, color, className = '' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`w-full bg-gray-200 h-2 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

/**
 * Risk flag badge
 */
function RiskBadge({ active, icon, label, colorClass }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
      {icon} {label}
    </span>
  );
}

/**
 * Urgency adjustment indicator
 */
function UrgencyIndicator({ adjustment }) {
  const config = {
    higher: { icon: '⬆️', label: 'Срочность повышена', className: 'text-red-700 bg-red-50 border-red-200' },
    lower: { icon: '⬇️', label: 'Срочность понижена', className: 'text-green-700 bg-green-50 border-green-200' },
    unchanged: { icon: '—', label: 'Срочность без изменений', className: 'text-gray-600 bg-gray-50 border-gray-200' },
  };
  const { icon, label, className } = config[adjustment] || config.unchanged;
  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded border ${className}`}>
      <span className="text-base">{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

/**
 * Road segment detail content
 */
function RoadContent({ data, enrichment }) {
  const priorityScore = data.priority_score ?? 0;
  const severityColor = getSeverityColor(priorityScore);
  const severityLabel = getSeverityLabel(priorityScore);

  const savings = data.emergency_cost_tenge && data.fix_cost_tenge
    ? data.emergency_cost_tenge - data.fix_cost_tenge
    : null;

  return (
    <>
      {/* Priority Score */}
      <Block>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Приоритет</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: severityColor }}>
              {Math.round(priorityScore)}
            </span>
            <span className="text-xs text-gray-400">/ 100</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityBadgeClass(priorityScore)}`}>
              {severityLabel}
            </span>
          </div>
        </div>
        <ProgressBar value={priorityScore} color={severityColor} />
      </Block>

      {/* Key Metrics */}
      <Block>
        <BlockLabel icon="📊">Ключевые показатели</BlockLabel>
        <Row
          label="Дефекты"
          value={data.defects_per_100m != null ? `${data.defects_per_100m}/100м` : '—'}
        />
        <Row
          label="Трафик"
          value={data.daily_traffic_vehicles != null ? `${data.daily_traffic_vehicles.toLocaleString('ru-RU')} авто/день` : '—'}
        />
        <Row
          label="Грузовики"
          value={formatPercent(data.truck_share_percent / 100)}
          icon={data.is_truck_heavy ? '🚛' : null}
          valueClass={data.is_truck_heavy ? 'text-amber-600' : 'text-gray-900'}
        />
        <Row
          label="Заморозки"
          value={formatPercent(data.freeze_exposure_score)}
          icon={data.is_high_freeze_risk ? '❄️' : null}
          valueClass={data.is_high_freeze_risk ? 'text-blue-600' : 'text-gray-900'}
        />
        {data.road_pressure != null && (
          <Row label="Нагрузка на дорогу" value={data.road_pressure.toFixed(2)} />
        )}
        {data.truck_damage_factor != null && (
          <Row label="Фактор повреждений от грузовиков" value={data.truck_damage_factor.toFixed(2)} />
        )}
      </Block>

      {/* Financial Impact */}
      <Block>
        <BlockLabel icon="💰">Финансовое влияние</BlockLabel>
        <Row
          label="Ремонт сейчас"
          value={formatTenge(data.fix_cost_tenge, true)}
        />
        <Row
          label="Аварийный ремонт"
          value={formatTenge(data.emergency_cost_tenge, true)}
          valueClass="text-red-600"
        />
        {savings != null && savings > 0 && (
          <Row
            label="Экономия при ремонте сейчас"
            value={formatTenge(savings, true)}
            valueClass="text-green-600"
          />
        )}
        {data.failure_probability_12mo != null && (
          <Row
            label="Вероятность отказа (12 мес)"
            value={formatPercent(data.failure_probability_12mo)}
            valueClass={data.failure_probability_12mo > 0.5 ? 'text-red-600' : 'text-gray-900'}
          />
        )}
        {data.financial_impact && (
          <>
            <div className="border-t border-gray-200 my-2" />
            <Row
              label="Общее влияние"
              value={formatTenge(data.financial_impact.total_impact_tenge, true)}
              valueClass="text-blue-600"
            />
            {data.financial_impact.estimated_days_until_failure != null && (
              <Row
                label="Дней до отказа"
                value={`~${Math.round(data.financial_impact.estimated_days_until_failure)}`}
                valueClass={data.financial_impact.estimated_days_until_failure < 90 ? 'text-red-600' : 'text-gray-900'}
              />
            )}
            {data.financial_impact.economic_value_per_day_tenge != null && (
              <Row
                label="Экономическая ценность/день"
                value={formatTenge(data.financial_impact.economic_value_per_day_tenge, true)}
              />
            )}
          </>
        )}
      </Block>

      {/* Risk Flags */}
      <Block>
        <BlockLabel icon="🚨">Флаги риска</BlockLabel>
        <div className="flex flex-wrap gap-2">
          <RiskBadge
            active={data.is_critical}
            icon="⚠️"
            label="Критический"
            colorClass="bg-red-100 text-red-700 border border-red-300"
          />
          <RiskBadge
            active={data.is_high_freeze_risk}
            icon="❄️"
            label="Высокий риск заморозков"
            colorClass="bg-blue-100 text-blue-700 border border-blue-300"
          />
          <RiskBadge
            active={data.is_truck_heavy}
            icon="🚛"
            label="Много грузовиков"
            colorClass="bg-amber-100 text-amber-700 border border-amber-300"
          />
          {!data.is_critical && !data.is_high_freeze_risk && !data.is_truck_heavy && (
            <span className="text-xs text-gray-400 italic">Нет активных флагов</span>
          )}
        </div>
      </Block>

      {/* Brain 2 Enrichment */}
      {enrichment && (
        <Block className="bg-purple-50 border-purple-200">
          <BlockLabel icon="🧠">Анализ Brain 2</BlockLabel>
          {enrichment.hidden_risks && (
            <p className="text-xs text-gray-700 leading-relaxed mb-3">
              "{enrichment.hidden_risks}"
            </p>
          )}
          {enrichment.reasoning && (
            <p className="text-xs text-gray-600 leading-relaxed mb-3 italic">
              {enrichment.reasoning}
            </p>
          )}
          <UrgencyIndicator adjustment={enrichment.urgency_adjustment} />
          {enrichment.seasonal_note && (
            <div className="flex items-start gap-2 mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
              <span>📅</span>
              <span>"{enrichment.seasonal_note}"</span>
            </div>
          )}
        </Block>
      )}

      {/* Data Completeness */}
      <Block>
        <BlockLabel icon="📈">Полнота данных</BlockLabel>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Качество данных</span>
          <span className="text-sm font-medium text-gray-700">
            {formatPercent(data.data_completeness_score)}
          </span>
        </div>
        <ProgressBar
          value={(data.data_completeness_score ?? 0) * 100}
          color={data.data_completeness_score >= 0.8 ? '#4CAF50' : data.data_completeness_score >= 0.5 ? '#FF9800' : '#E53935'}
        />
      </Block>
    </>
  );
}

/**
 * Camera zone detail content
 */
function CameraContent({ data, enrichment }) {
  const priorityScore = data.priority_score ?? 0;
  const severityColor = getSeverityColor(priorityScore);
  const severityLabel = getSeverityLabel(priorityScore);

  const roi = data.roi || {};

  return (
    <>
      {/* Priority Score */}
      <Block>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Приоритет</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: severityColor }}>
              {Math.round(priorityScore)}
            </span>
            <span className="text-xs text-gray-400">/ 100</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityBadgeClass(priorityScore)}`}>
              {severityLabel}
            </span>
          </div>
        </div>
        <ProgressBar value={priorityScore} color={severityColor} />
      </Block>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            data.is_monitored
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-amber-100 text-amber-700 border border-amber-300'
          }`}
        >
          {data.is_monitored ? '📹 Камера установлена' : '⚠️ Нет мониторинга'}
        </span>
      </div>

      {/* Key Metrics */}
      <Block>
        <BlockLabel icon="📊">Ключевые показатели</BlockLabel>
        <Row
          label="Нарушений/месяц"
          value={
            data.violations_per_month != null
              ? data.violations_per_month.toLocaleString('ru-RU')
              : data.estimated_violations_per_month != null
              ? `~${data.estimated_violations_per_month.toLocaleString('ru-RU')} (оценка)`
              : '—'
          }
          valueClass={data.is_high_violation_zone ? 'text-red-600' : 'text-gray-900'}
        />
        <Row
          label="Аварий/год"
          value={data.accidents_per_year ?? '—'}
        />
        <Row
          label="Трафик"
          value={data.daily_traffic_vehicles != null ? `${data.daily_traffic_vehicles.toLocaleString('ru-RU')} авто/день` : '—'}
        />
        <Row
          label="Пробел покрытия"
          value={data.coverage_gap_km != null ? `${data.coverage_gap_km} км` : '—'}
          valueClass={data.is_critical_gap ? 'text-red-600' : 'text-gray-900'}
        />
        {data.road_politeness_score != null && (
          <Row
            label="Культура вождения"
            value={data.road_politeness_score.toFixed(1)}
            valueClass={data.road_politeness_score < 50 ? 'text-amber-600' : 'text-green-600'}
          />
        )}
        {data.safety_gap != null && (
          <Row
            label="Разрыв безопасности"
            value={data.safety_gap.toFixed(2)}
            valueClass={data.safety_gap > 0.5 ? 'text-red-600' : 'text-gray-900'}
          />
        )}
      </Block>

      {/* ROI Section */}
      {roi && Object.keys(roi).length > 0 && (
        <Block>
          <BlockLabel icon="💰">ROI анализ</BlockLabel>
          <Row
            label="Оценка ROI"
            value={roi.roi_score != null ? roi.roi_score.toFixed(2) : '—'}
            valueClass={roi.is_positive_roi ? 'text-green-600' : 'text-red-600'}
          />
          <Row
            label="Годовой доход"
            value={formatTenge(roi.estimated_annual_revenue_tenge, true)}
            valueClass="text-green-600"
          />
          <Row
            label="Стоимость установки"
            value={formatTenge(roi.install_cost_tenge, true)}
          />
          <Row
            label="Обслуживание/год"
            value={formatTenge(roi.annual_maintenance_tenge, true)}
          />
          <Row
            label="Окупаемость"
            value={formatMonths(roi.breakeven_months)}
            valueClass={roi.breakeven_months < 12 ? 'text-green-600' : roi.breakeven_months < 24 ? 'text-amber-600' : 'text-red-600'}
          />
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className={`text-xs px-2 py-1.5 rounded text-center font-medium ${
              roi.is_positive_roi
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {roi.is_positive_roi ? '✅ Положительный ROI' : '❌ Отрицательный ROI'}
            </div>
          </div>
        </Block>
      )}

      {/* Risk Flags */}
      <Block>
        <BlockLabel icon="🚨">Флаги риска</BlockLabel>
        <div className="flex flex-wrap gap-2">
          <RiskBadge
            active={data.is_critical_gap}
            icon="🔴"
            label="Критический пробел"
            colorClass="bg-red-100 text-red-700 border border-red-300"
          />
          <RiskBadge
            active={data.is_high_violation_zone}
            icon="⚠️"
            label="Много нарушений"
            colorClass="bg-amber-100 text-amber-700 border border-amber-300"
          />
          <RiskBadge
            active={data.is_survivorship_bias_case}
            icon="👁️"
            label="Ошибка выжившего"
            colorClass="bg-purple-100 text-purple-700 border border-purple-300"
          />
          {!data.is_critical_gap && !data.is_high_violation_zone && !data.is_survivorship_bias_case && (
            <span className="text-xs text-gray-400 italic">Нет активных флагов</span>
          )}
        </div>
      </Block>

      {/* Brain 2 Enrichment */}
      {enrichment && (
        <Block className="bg-purple-50 border-purple-200">
          <BlockLabel icon="🧠">Анализ Brain 2</BlockLabel>
          {enrichment.hidden_risks && (
            <p className="text-xs text-gray-700 leading-relaxed mb-3">
              "{enrichment.hidden_risks}"
            </p>
          )}
          {enrichment.reasoning && (
            <p className="text-xs text-gray-600 leading-relaxed mb-3 italic">
              {enrichment.reasoning}
            </p>
          )}
          <UrgencyIndicator adjustment={enrichment.urgency_adjustment} />
          {enrichment.survivorship_bias_note && (
            <div className="flex items-start gap-2 mt-3 text-xs text-purple-700 bg-purple-100 border border-purple-200 rounded p-2">
              <span>👁️</span>
              <span>"{enrichment.survivorship_bias_note}"</span>
            </div>
          )}
        </Block>
      )}

      {/* Data Completeness */}
      <Block>
        <BlockLabel icon="📈">Полнота данных</BlockLabel>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Качество данных</span>
          <span className="text-sm font-medium text-gray-700">
            {formatPercent(data.data_completeness_score)}
          </span>
        </div>
        <ProgressBar
          value={(data.data_completeness_score ?? 0) * 100}
          color={data.data_completeness_score >= 0.8 ? '#4CAF50' : data.data_completeness_score >= 0.5 ? '#FF9800' : '#E53935'}
        />
      </Block>
    </>
  );
}

/**
 * Detail panel for road segments and camera zones
 */
export default function DetailPanel({ type, data, enrichment, onClose }) {
  if (!type || !data) return null;

  const isRoad = type === 'road';
  const name = isRoad ? data.name : data.name;
  const district = data.district || '—';
  const roadClass = getRoadClassLabel(data.road_class);
  const rank = data.brain1_rank ?? '—';
  const trafficTier = getTrafficTierLabel(data.traffic_tier);

  return (
    <div className="w-full bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden h-full relative shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between gap-2 pr-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-900 leading-tight">
              {isRoad ? '🛣️' : '📹'} {name || (isRoad ? data.segment_id : data.intersection_id)}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                {district}
              </span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                {roadClass}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                #{rank}
              </span>
            </div>
            {trafficTier && (
              <div className="mt-1.5">
                <span className="text-xs text-gray-500">
                  Трафик: <span className="font-medium text-gray-700">{trafficTier}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
          aria-label="Закрыть панель"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isRoad ? (
          <RoadContent data={data} enrichment={enrichment} />
        ) : (
          <CameraContent data={data} enrichment={enrichment} />
        )}
      </div>

      {/* Footer with ID */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-400 font-mono truncate">
          ID: {isRoad ? data.segment_id : data.intersection_id}
        </div>
      </div>
    </div>
  );
}
