import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useEffect } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { incidents, actionsByType, predictionsByAction } from "../data/incidentsData";
import { heatmapPoints } from "../data/mockData";

function HeatLayer() {
  const map = useMap();
  useEffect(() => {
    import("leaflet.heat").then(() => {
      const heat = window.L.heatLayer(heatmapPoints, {
        radius: 26, blur: 18, maxZoom: 14,
        gradient: { 0.2:"#4575b4", 0.4:"#74add1", 0.6:"#fee090", 0.8:"#f46d43", 1.0:"#d73027" },
      });
      heat.addTo(map);
      return () => map.removeLayer(heat);
    });
  }, [map]);
  return null;
}

function makeIncidentIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function PredictionCard({ pred }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: pred.color }} />
        <span className="text-xs font-medium text-gray-900">{pred.title}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{pred.text}</p>
      <p className="text-sm font-medium mt-1.5" style={{ color: pred.color }}>{pred.val}</p>
    </div>
  );
}

function SimPanel({ incident, onClose }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const actions = actionsByType[incident.type] || [];

  async function runSim() {
    setLoading(true);
    setPredictions(null);
    try {
      const res = await fetch("http://localhost:3001/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, action: selectedAction }),
      });
      if (!res.ok) throw new Error();
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
      <div className="px-4 py-3 border-b border-gray-200 flex items-start justify-between bg-gray-50">
        <div>
          <div className="text-sm font-medium text-gray-900">Симуляция</div>
          <div className="text-xs text-gray-400 mt-0.5 max-w-48 truncate">{incident.name}</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: incident.color }} />
          <div>
            <div className="text-xs font-medium text-gray-900">{incident.name}</div>
            <div className="text-xs text-gray-400">{incident.loc}</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Выберите действие</div>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => { setSelectedAction(action.id); setPredictions(null); }}
                className={`text-left p-2.5 rounded-lg border transition-all ${
                  selectedAction === action.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
              >
                <div style={{ fontSize: 16 }}>{action.icon}</div>
                <div className="text-xs font-medium text-gray-900 mt-1">{action.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{action.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runSim}
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
          ) : "Запустить симуляцию"}
        </button>

        {predictions && (
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Прогноз ИИ</div>
            {predictions.map((pred, i) => <PredictionCard key={i} pred={pred} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SimulationTab() {
  const [activeIncident, setActiveIncident] = useState(null);

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden relative">
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          center={[43.2551, 76.9126]}
          zoom={13}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <HeatLayer />
          {incidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={makeIncidentIcon(inc.color)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{inc.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{inc.loc}</div>
                  <button
                    onClick={() => setActiveIncident(inc)}
                    style={{ background: "#185FA5", color: "#fff", border: "none", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", width: "100%" }}
                  >
                    Симулировать действие
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
            <div className="text-xs font-medium text-gray-900">Симуляция действий</div>
            <div className="text-xs text-gray-400 mt-0.5">{incidents.length} активных происшествий · нажмите на метку</div>
          </div>
        </div>

        {!activeIncident && (
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
            {incidents.map((inc) => (
              <button
                key={inc.id}
                onClick={() => setActiveIncident(inc)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-left hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: inc.color }} />
                  <div>
                    <div className="text-xs font-medium text-gray-900">{inc.name}</div>
                    <div className="text-xs text-gray-400">{inc.loc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

      </div>

      {activeIncident && (
        <SimPanel incident={activeIncident} onClose={() => setActiveIncident(null)} />
      )}
    </div>
  );
}