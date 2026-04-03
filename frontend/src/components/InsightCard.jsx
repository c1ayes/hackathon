import { formatTenge } from "../data/mockData";

// структура которая придет с бэкэнда
// { what: string, critical: string, action: string, savings: number }

export default function InsightCard({ insight, loading }) {
  if (loading) {
    return (
      <div className="bg-white border-t border-gray-200 px-5 py-4 flex items-center justify-center gap-2">
        <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-400">ИИ анализирует данные...</span>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-white border-t border-gray-200 px-5 py-4 text-center text-sm text-gray-400">
        Нажмите «Анализировать», чтобы ИИ выдал приоритеты и оценку экономии
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 px-5 py-4">
      <div className="grid grid-cols-3 gap-3">

        {/* чо происходит */}
        <div className="bg-gray-50 rounded-lg px-3 py-2.5">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1" style={{ fontSize: 9 }}>
            Что происходит
          </div>
          <div className="text-xs text-gray-900 leading-relaxed">{insight.what}</div>
        </div>

        {/* критично */}
        <div className="bg-red-50 rounded-lg px-3 py-2.5">
          <div className="text-xs text-red-400 uppercase tracking-wider mb-1" style={{ fontSize: 9 }}>
            Критично
          </div>
          <div className="text-xs text-red-800 leading-relaxed">{insight.critical}</div>
        </div>

        {/* действия + тг */}
        <div className="bg-blue-50 rounded-lg px-3 py-2.5">
          <div className="text-xs text-blue-400 uppercase tracking-wider mb-1" style={{ fontSize: 9 }}>
            Рекомендацич
          </div>
          <div className="text-xs text-blue-900 leading-relaxed">{insight.action}</div>
          {insight.savings && (
            <div className="text-sm font-medium text-blue-600 mt-1.5">
              Экономия: {formatTenge(insight.savings)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}