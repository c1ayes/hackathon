import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { heatmapPoints } from "../data/mockData";

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

      return () => {
        map.removeLayer(heat);
      };
    });
  }, [map]);

  return null;
}

export default function HeatMap() {
  return (
    <div className="relative h-56 border-b border-gray-200 shrink-0">
      <MapContainer
        center={[43.2551, 76.9126]}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <HeatLayer />
      </MapContainer>

      {/* <div className="absolute bottom-2 left-2 z-[1000] bg-white border border-gray-200 rounded-lg px-3 py-2">
        <div
          className="w-20 h-1.5 rounded-full mb-1"
          style={{
            background:
              "linear-gradient(to right, #4575b4, #74add1, #fee090, #f46d43, #d73027)",
          }}
        />
        <div className="flex justify-between text-gray-400" style={{ fontSize: 9 }}>
          <span>Мало</span>
          <span>Много жалоб</span>
        </div>
      </div>

      <div className="absolute top-2 right-2 z-[1000] bg-white border border-gray-200 rounded-lg px-3 py-2 text-right">
        <div className="text-lg font-medium text-red-500">
          {totalComplaints.toLocaleString("ru-RU")}
        </div>
        <div className="text-xs text-gray-400">Жалоб за месяц</div>
      </div> */}
    </div>
  );
}