import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import RoadsLayer from "./RoadsLayer";

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
        <RoadsLayer />
      </MapContainer>
    </div>
  );
}