import { useState } from "react";

import { actionsByType, predictionsByAction } from "../data/incidentsData";

function PredictionCard({ pred }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: pred.color }}
        />
        <span className="text-xs font-medium text-gray-900">{pred.title}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{pred.text}</p>
      <p className="text-sm font-medium mt-1" style={{ color: pred.color }}>
        {pred.val}
      </p>
    </div>
  );
}

export default function SimulationPanel({ incident, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const actions = actionsByType[incident.type] || [];

  async function runSimulation() {
    setLoading(true);
    setPredictions(null);

    try {
      const res = await fetch("http://localhost:3001/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, action: selectedAction }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setPredictions(data.predictions);
    } catch {
      setPredictions(predictionsByAction[selectedAction] || predictionsByAction["detour"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900">Симуляция</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-48">
            {incident.name}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Место
          </div>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: incident.color }}
            />
            <div>
              <div className="text-xs font-medium text-gray-900">{incident.name}</div>
              <div className="text-xs text-gray-400">{incident.loc}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Выберите действие
          </div>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  setSelectedAction(action.id);
                  setPredictions(null);
                }}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  selectedAction === action.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
              >
                <div style={{ fontSize: 16 }}>{action.icon}</div>
                <div className="text-xs font-medium text-gray-900 mt-1">
                  {action.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{action.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={!selectedAction || loading}
          className={`w-full py-2.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedAction || loading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-200 border-t-white rounded-full animate-spin" />
              Симулирую...
            </span>
          ) : (
            "Запустить симуляцию"
          )}
        </button>

        {predictions && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Прогноз ИИ
            </div>
            {predictions.map((pred, i) => (
              <PredictionCard key={i} pred={pred} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}