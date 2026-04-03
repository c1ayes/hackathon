export default function TopBar({ onAnalyze, loading }) {
  return (
    <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
      <div>
        <div className="text-sm font-medium text-gray-900">
          Панель управления городом
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Данные обновлены: 3 апреля 2025
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors
          ${loading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
            : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }`}
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Анализирую...
          </>
        ) : (
          <>
            <span>▶</span>
            Анализировать
          </>
        )}
      </button>
    </div>
  );
}