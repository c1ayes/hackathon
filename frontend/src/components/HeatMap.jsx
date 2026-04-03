import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { heatmapPoints, totalComplaints } from "../data/mockData";
import RoadsLayer from "./RoadsLayer";

function HeatLayer() {
  const map = useMap();
  useEffect(() => {
    import("leaflet.heat").then(() => {
      const heat = window.L.heatLayer(heatmapPoints, {
        radius: 28, blur: 20, maxZoom: 14,
        gradient: { 0.2:"#4575b4", 0.4:"#74add1", 0.6:"#fee090", 0.8:"#f46d43", 1.0:"#d73027" },
      });
      heat.addTo(map);
      return () => map.removeLayer(heat);
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
        <RoadsLayer />
      </MapContainer>
    </div>
  );
}