import { useEffect, useState } from "react";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { incidents } from "../data/incidentsData";
import { heatmapPoints } from "../data/mockData";
import SimulationPanel from "./SimulationPanel";


function HeatLayer() {
  const map = useMap();
  useEffect(() => {
    import("leaflet.heat").then(() => {
      const heat = window.L.heatLayer(heatmapPoints, {
        radius: 28,
        blur: 20,
        maxZoom: 14,
        gradient: {
          0.2: "#4575b4",
          0.4: "#74add1",
          0.6: "#fee090",
          0.8: "#f46d43",
          1.0: "#d73027",
        },
      });
      heat.addTo(map);
      return () => map.removeLayer(heat);
    });
  }, [map]);
  return null;
}

function makeIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function IncidentsPage() {
  const [activeIncident, setActiveIncident] = useState(null);
  const [simOpen, setSimOpen] = useState(false);

  function openSim(incident) {
    setActiveIncident(incident);
    setSimOpen(true);
  }

  function closeSim() {
    setSimOpen(false);
    setActiveIncident(null);
  }

  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
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
              icon={makeIcon(inc.color)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>
                    {inc.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                    {inc.loc}
                  </div>
                  <button
                    onClick={() => openSim(inc)}
                    style={{
                      background: "#185FA5",
                      color: "#fff",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    Симулировать действие
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-start justify-between gap-2 pointer-events-none">
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 pointer-events-auto">
            <div className="text-xs font-medium text-gray-900">Карта происшествий</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {incidents.length} активных · нажмите на метку
            </div>
          </div>

          {!simOpen && (
            <div className="flex flex-col gap-1.5 pointer-events-auto">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => openSim(inc)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-left hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: inc.color }}
                    />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {inc.name}
                      </div>
                      <div className="text-xs text-gray-400">{inc.loc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {simOpen && activeIncident && (
        <SimulationPanel incident={activeIncident} onClose={closeSim} />
      )}
    </div>
  );
}