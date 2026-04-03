import { useState } from 'react';
import { formatTenge, getSeverityColor, getRoadClassLabel } from '../utils/formatters';

/**
 * RoadsPriorityPanel - Left panel showing roads ranked by priority score
 * with financial impact visualization
 */
export default function RoadsPriorityPanel({ roads = [], selectedId, onSelect }) {
  const [sortAscending, setSortAscending] = useState(false);

  // Count critical roads
  const criticalCount = roads.filter(r => r.is_critical).length;

  // Sort roads based on current sort direction
  const sortedRoads = sortAscending ? [...roads].reverse() : roads;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛣️</span>
            <span className="font-semibold text-gray-800">Дороги</span>
          </div>
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
            title={sortAscending ? 'Сортировать по убыванию' : 'Сортировать по возрастанию'}
          >
            {sortAscending ? '↑' : '↓'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Всего: {roads.length} | Критичных: {criticalCount}
        </div>
      </div>

      {/* Scrollable road cards list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedRoads.map((road, index) => {
          const rank = sortAscending ? roads.length - index : index + 1;
          const isSelected = road.segment_id === selectedId;
          const scoreColor = getSeverityColor(road.priority_score);
          const scorePercent = Math.min(100, Math.max(0, road.priority_score));

          return (
            <div
              key={road.segment_id}
              onClick={() => onSelect?.(road.segment_id)}
              className={`
                bg-white rounded-lg p-3 cursor-pointer transition-all border-2
                ${isSelected 
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Rank and Name */}
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-xs font-bold text-gray-400 shrink-0">
                  #{rank}
                </span>
                <span className="text-sm font-semibold text-gray-800 truncate">
                  {road.name}
                </span>
              </div>

              {/* District and Road Class */}
              <div className="text-xs text-gray-500 mb-2">
                {road.district} • {getRoadClassLabel(road.road_class)}
              </div>

              {/* Priority Score Progress Bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
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
                  {Math.round(road.priority_score)}
                </span>
              </div>

              {/* Financial Impact and Risk Flags */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span>💰</span>
                  <span className="font-medium">
                    {formatTenge(road.financial_impact?.total_impact_tenge, true)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {road.is_critical && (
                    <span title="Критичный" className="text-sm">🔴</span>
                  )}
                  {road.is_high_freeze_risk && (
                    <span title="Риск заморозки" className="text-sm">❄️</span>
                  )}
                  {road.is_truck_heavy && (
                    <span title="Грузовой трафик" className="text-sm">🚛</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {roads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="text-3xl mb-2">🛣️</span>
            <span className="text-sm">Нет данных о дорогах</span>
          </div>
        )}
      </div>
    </div>
  );
}
