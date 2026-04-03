import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { camerasData, heatmapPoints, formatTenge } from "../data/mockData";
import CameraDetailPanel from "./CameraDetailPanel";
import RoadsLayer from "./RoadsLayer";
import SimulationTab from "./SimulationTab";

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

function makeCameraIcon(camera, isSelected) {
  const color = camera.status === "UNMONITORED" ? "#EF9F27" : "#22c55e";
  const size = isSelected ? 18 : 13;
  const ring = isSelected ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color};` : "";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;${ring}transition:all 0.2s;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function SectionPopup({ selected, onClose }) {
  const total = selected.length;
  const unmonitored = selected.filter((c) => c.status === "UNMONITORED").length;
  const totalCost = selected.reduce((s, c) => s + c.installCost, 0);
  const totalRevenue = selected.reduce((s, c) => s + c.annualRevenue, 0);
  const combinedRoi = (totalRevenue / totalCost).toFixed(2);
  const payback = ((totalCost / totalRevenue) * 12).toFixed(1);
  const totalAccidents = selected.reduce((s, c) => s + c.accidents, 0);
  const totalPrevented = selected.reduce((s, c) => s + c.accidentsPrevented, 0);
  const dominantDistrict = selected.map((c) => c.district)
    .sort((a, b) => selected.filter((c) => c.district === b).length - selected.filter((c) => c.district === a).length)[0];
  const sorted = [...selected].sort((a, b) => b.roi - a.roi);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2000] w-full max-w-lg pointer-events-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <div className="text-sm font-medium text-gray-900">Секция камер — {dominantDistrict}</div>
            <div className="text-xs text-gray-400 mt-0.5">{total} камер · {unmonitored} не охвачено · {total - unmonitored} активных</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Суммарные финансы</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Стоимость установки</span><span className="font-medium">{formatTenge(totalCost)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Доход / год</span><span className="font-medium text-green-600">{formatTenge(totalRevenue)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Совокупный ROI</span><span className="font-medium text-blue-600">×{combinedRoi}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Окупаемость</span><span className="font-medium">~{payback} мес.</span></div>
              <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded p-2 mt-2">Установить все {total} → {formatTenge(totalRevenue)} / год</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Безопасность</div>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-xs"><span className="text-gray-500">Аварий в зоне / год</span><span className="font-medium">{totalAccidents}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Предотвращаемых / год</span><span className="font-medium text-green-600">~{totalPrevented}</span></div>
            </div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Порядок установки</div>
            <div className="space-y-1">
              {sorted.map((cam, i) => (
                <div key={cam.id} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400 w-4">{i + 1}.</span>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cam.status === "UNMONITORED" ? "#EF9F27" : "#22c55e" }} />
                  <span className="text-gray-700 truncate">{cam.name}</span>
                  <span className="text-blue-600 ml-auto shrink-0">×{cam.roi.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {selected.some((c) => c.gapDistance > 0) && (
          <div className="px-4 pb-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <span className="font-medium">Поведенческий разрыв: </span>
              Водители эксплуатируют незакрытые участки между камерами. Установка промежуточной точки закроет лазейку.
            </div>
          </div>
        )}
        <div className="px-4 pb-4">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-xs font-medium transition-colors">
            Запланировать установку всех {total} камер
          </button>
        </div>
      </div>
    </div>
  );
}

function CamerasTab() {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [multiSelected, setMultiSelected] = useState([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const holdTimer = useRef(null);

  function handleMouseDown(cam) {
    holdTimer.current = setTimeout(() => {
      setIsMultiMode(true);
      setSelectedCamera(null);
      setMultiSelected([cam]);
    }, 500);
  }

  function handleMouseUp() { clearTimeout(holdTimer.current); }

  function handleCameraClick(cam) {
    if (isMultiMode) {
      setMultiSelected((prev) =>
        prev.find((c) => c.id === cam.id) ? prev.filter((c) => c.id !== cam.id) : [...prev, cam]
      );
    } else {
      setSelectedCamera((prev) => (prev?.id === cam.id ? null : cam));
    }
  }

  function exitMultiMode() {
    setIsMultiMode(false);
    setMultiSelected([]);
    setShowSection(false);
  }

  const highlightRoadId = selectedCamera?.linkedRoadId ?? null;

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
          <RoadsLayer highlightRoadId={highlightRoadId} />
          {camerasData.map((cam) => {
            const isSelected = !!(multiSelected.find((c) => c.id === cam.id) || selectedCamera?.id === cam.id);
            return (
              <Marker
                key={cam.id}
                position={[cam.lat, cam.lng]}
                icon={makeCameraIcon(cam, isSelected)}
                eventHandlers={{
                  click: () => handleCameraClick(cam),
                  mousedown: () => handleMouseDown(cam),
                  mouseup: handleMouseUp,
                }}
              />
            );
          })}
        </MapContainer>

        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 pointer-events-auto">
            <div className="text-xs font-medium text-gray-900">Камеры и дороги</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {isMultiMode ? `Режим выбора: ${multiSelected.length} камер` : "Нажмите на камеру · удерживайте для выбора нескольких"}
            </div>
          </div>
          {isMultiMode && (
            <button onClick={exitMultiMode} className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 pointer-events-auto">
              Отмена
            </button>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-[1000] bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />Активна</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />Не охвачено</div>
          </div>
        </div>

        {isMultiMode && multiSelected.length > 1 && !showSection && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[2000] pointer-events-auto">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-3 flex items-center gap-6">
              <div>
                <div className="text-xs text-gray-400">Выбрано</div>
                <div className="text-lg font-medium text-gray-900">{multiSelected.length} камер</div>
              </div>
              <div className="border-l border-gray-200 pl-6">
                <div className="text-xs text-gray-400">Совокупный ROI</div>
                <div className="text-lg font-medium text-blue-600">
                  ×{(multiSelected.reduce((s, c) => s + c.annualRevenue, 0) / multiSelected.reduce((s, c) => s + c.installCost, 0)).toFixed(2)}
                </div>
              </div>
              <button onClick={() => setShowSection(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-medium transition-colors">
                Анализ секции
              </button>
            </div>
          </div>
        )}

        {showSection && multiSelected.length > 1 && (
          <SectionPopup selected={multiSelected} onClose={() => setShowSection(false)} />
        )}
      </div>

      {selectedCamera && !isMultiMode && (
        <CameraDetailPanel camera={selectedCamera} onClose={() => setSelectedCamera(null)} />
      )}
    </div>
  );
}

export default function IncidentsPage() {
  const [tab, setTab] = useState("cameras");

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* tab bar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center gap-0 shrink-0">
        {[
          { id: "cameras", label: "Камеры и дороги" },
          { id: "simulation", label: "Симуляция действий" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cameras" && <CamerasTab />}
      {tab === "simulation" && <SimulationTab />}
    </div>
  );
}